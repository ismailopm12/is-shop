import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UDDOKTAPAY_API_KEY = Deno.env.get("UDDOKTAPAY_API_KEY")!;
    
    if (!UDDOKTAPAY_API_KEY) {
      console.error("UDDOKTAPAY_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: "Payment gateway configuration error", details: "API key missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const UDDOKTAPAY_BASE_URL = "https://gamesbazarnet.paymently.io";

    let invoiceId: string | null = null;

    if (req.method === "POST") {
      const body = await req.json();
      invoiceId = body.invoice_id || null;
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      invoiceId = url.searchParams.get("invoice_id");
    }

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Missing invoice_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with UddoktaPay
    const verifyResponse = await fetch(`${UDDOKTAPAY_BASE_URL}/api/verify-payment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error(`UddoktaPay verification error (${verifyResponse.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: "Payment verification failed", details: errorText || `HTTP ${verifyResponse.status}` }),
        { status: verifyResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifyResult = await verifyResponse.json();
    console.log("Verify result:", JSON.stringify(verifyResult));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (verifyResult.status === "COMPLETED") {
      const paidAmount = parseFloat(verifyResult.amount || "0");

      // Look up payment record by invoice_id
      const { data: payRecord } = await supabase
        .from("payment_records")
        .select("*")
        .eq("invoice_id", invoiceId)
        .single();

      // Also try to find by amount + status if no invoice match (webhook may arrive first)
      let record = payRecord;
      if (!record) {
        // Try matching by recent pending payment with same amount
        const { data: recentRecord } = await supabase
          .from("payment_records")
          .select("*")
          .eq("status", "pending")
          .eq("amount", paidAmount)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        record = recentRecord;
      }

      if (!record) {
        return new Response(
          JSON.stringify({ status: "success", message: "Payment verified but no matching record found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark payment record as completed
      await supabase.from("payment_records").update({ status: "completed", invoice_id: invoiceId }).eq("id", record.id);

      if (record.type === "add_money") {
        const { data: profile } = await supabase
          .from("profiles").select("balance").eq("user_id", record.user_id).single();

        if (profile) {
          await supabase.from("profiles")
            .update({ balance: profile.balance + paidAmount })
            .eq("user_id", record.user_id);
        }

        return new Response(
          JSON.stringify({ status: "success", type: "add_money", amount: paidAmount }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (record.type === "product" && record.order_id) {
        const { data: existingOrder } = await supabase
          .from("orders").select("status").eq("id", record.order_id).single();

        if (existingOrder?.status === "completed") {
          return new Response(
            JSON.stringify({ status: "already_completed", order_id: record.order_id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (record.is_voucher && record.product_id && record.user_id) {
          // Try variant_id first (new system), then fallback to package_id (old system)
          const packageOrVariantId = record.variant_id || record.package_id;
          
          const { data: voucherCode } = await supabase.rpc("assign_voucher_to_order", {
            _order_id: record.order_id,
            _product_id: record.product_id,
            _user_id: record.user_id,
            _package_id: packageOrVariantId || null,
          });

          if (!voucherCode) {
            await supabase.from("orders").update({ status: "processing" }).eq("id", record.order_id);
            return new Response(
              JSON.stringify({ status: "no_voucher_stock", order_id: record.order_id }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        await supabase.from("orders").update({ status: "completed" }).eq("id", record.order_id);

        return new Response(
          JSON.stringify({ status: "success", type: "product", order_id: record.order_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ status: "success", details: verifyResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ status: verifyResult.status || "unknown", details: verifyResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
