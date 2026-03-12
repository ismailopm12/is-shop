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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email || "customer@example.com";

    const body = await req.json();
    const { product_name, player_id, package_info, amount, product_id, package_id, variant_id, is_voucher, type } = body;
    console.log("Request body package_id:", package_id, "variant_id:", variant_id, "product_id:", product_id, "is_voucher:", is_voucher);
    const paymentAmount = amount;
    const fullName = body.full_name || "Customer";

    if (!paymentAmount || paymentAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let orderId: string | null = null;

    if (type === "product") {
      const orderDataToInsert: any = {
        user_id: userId,
        product_name: product_name,
        player_id: is_voucher ? null : player_id,
        package_info: package_info || "N/A",
        amount: paymentAmount,
        status: "pending",
      };
      
      // Add package_id or variant_id based on what was provided
      if (variant_id && !package_id) {
        // New product_variants system
        orderDataToInsert.variant_id = variant_id || null;
      } else {
        // Old diamond_packages system
        orderDataToInsert.package_id = package_id || null;
      }
      
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(orderDataToInsert)
        .select("id").single();

      if (orderError || !orderData) {
        return new Response(JSON.stringify({ error: "Failed to create order", details: orderError?.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      orderId = orderData.id;
    }

    // Store payment metadata in DB instead of sending to UddoktaPay
    const payRecordData: any = {
      user_id: userId,
      type: type || "product",
      order_id: orderId,
      product_id: product_id || null,
      is_voucher: is_voucher || false,
      amount: paymentAmount,
      status: "pending",
    };
    
    // Add BOTH package_id and variant_id - save whichever is provided
    // For new system: variant_id will be set, package_id will be null
    // For old system: package_id will be set, variant_id will be null
    if (variant_id) {
      payRecordData.variant_id = variant_id || null;
    }
    if (package_id) {
      payRecordData.package_id = package_id || null;
    }
    
    console.log("Creating payment record with:", {
      variant_id: variant_id,
      package_id: package_id,
      final_data: payRecordData
    });
    
    const { data: payRecord, error: payRecordError } = await supabase
      .from("payment_records")
      .insert(payRecordData)
      .select("id").single();

    if (payRecordError) {
      console.log("Payment record error:", payRecordError.message);
    }

    const redirectUrl = body.redirect_url || "https://id-preview--86f2c321-3a16-43f0-a9b9-beeb20a639db.lovable.app/payment-callback";
    const UDDOKTAPAY_API_KEY = Deno.env.get("UDDOKTAPAY_API_KEY");
    
    if (!UDDOKTAPAY_API_KEY) {
      console.error("UDDOKTAPAY_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: "Payment gateway configuration error", details: "API key missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const UDDOKTAPAY_BASE_URL = "https://gamesbazarnet.paymently.io";

    const requestData: Record<string, any> = {
      full_name: fullName,
      email: userEmail,
      amount: paymentAmount,
      redirect_url: redirectUrl,
      cancel_url: redirectUrl + "?status=cancelled",
      webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-payment`,
    };

    const response = await fetch(`${UDDOKTAPAY_BASE_URL}/api/checkout-v2`, {
      method: "POST",
      headers: {
        "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
        "accept": "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`UddoktaPay API error (${response.status}):`, errorText);
      if (orderId) {
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
      }
      return new Response(
        JSON.stringify({ error: "Payment gateway error", details: errorText || `HTTP ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resultText = await response.text();
    console.log("UddoktaPay response status:", response.status);
    console.log("UddoktaPay response:", resultText);
    let result: any;
    try { 
      result = JSON.parse(resultText); 
    } catch { 
      result = { status: false, message: resultText, raw_response: resultText }; 
    }

    if (result.payment_url) {
      // Update payment record with invoice info if available
      if (payRecord?.id && result.invoice_id) {
        const adminSupabase = createClient(
          Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await adminSupabase.from("payment_records")
          .update({ invoice_id: result.invoice_id })
          .eq("id", payRecord.id);
      }

      return new Response(
        JSON.stringify({ payment_url: result.payment_url, order_id: orderId, payment_record_id: payRecord?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      if (orderId) {
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
      }
      return new Response(
        JSON.stringify({ error: "Payment creation failed", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
