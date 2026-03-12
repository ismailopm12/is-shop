import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [message, setMessage] = useState("");
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resultType, setResultType] = useState<string | null>(null);

  useEffect(() => {
    const cancelled = searchParams.get("status");
    if (cancelled === "cancelled") {
      setStatus("cancelled");
      setMessage("পেমেন্ট বাতিল করা হয়েছে।");
      return;
    }

    const invoiceId = searchParams.get("invoice_id");
    if (!invoiceId) {
      setStatus("failed");
      setMessage("পেমেন্ট তথ্য পাওয়া যায়নি।");
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { invoice_id: invoiceId },
        });

        if (error) {
          setStatus("failed");
          setMessage("পেমেন্ট ভেরিফাই করতে সমস্যা হয়েছে।");
          return;
        }

        if (data?.status === "success" || data?.status === "already_completed") {
          setStatus("success");
          setResultType(data.type);

          if (data.type === "add_money") {
            setMessage(`৳${data.amount} টাকা সফলভাবে ওয়ালেটে যোগ হয়েছে!`);
            refreshProfile();
          } else {
            setMessage("পেমেন্ট সফল হয়েছে! আপনার অর্ডার সম্পন্ন হয়েছে।");
            // Fetch the latest assigned voucher code for this user
            if (user && data.order_id) {
              const { data: vData } = await supabase
                .from("voucher_codes")
                .select("code")
                .eq("order_id", data.order_id)
                .eq("user_id", user.id)
                .single();
              if (vData?.code) {
                setVoucherCode(vData.code);
                setMessage("পেমেন্ট সফল! আপনার ভাউচার কোড নিচে দেখুন।");
              }
            }
          }
        } else if (data?.status === "no_voucher_stock") {
          setStatus("success");
          setMessage("পেমেন্ট সফল! কিন্তু ভাউচার স্টকে নেই। অ্যাডমিন শীঘ্রই প্রদান করবে।");
        } else {
          setStatus("failed");
          setMessage("পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন।");
        }
      } catch {
        setStatus("failed");
        setMessage("পেমেন্ট ভেরিফাই করতে সমস্যা হয়েছে।");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleCopy = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      toast.success("কোড কপি হয়েছে!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold">পেমেন্ট ভেরিফাই হচ্ছে...</h1>
            <p className="text-muted-foreground">অনুগ্রহ করে অপেক্ষা করুন</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-green-600">সফল!</h1>
            <p className="text-muted-foreground">{message}</p>

            {voucherCode && (
              <div className="bg-card border border-primary/30 rounded-xl p-5 card-shadow space-y-3">
                <p className="text-sm font-medium text-muted-foreground">আপনার ভাউচার কোড:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl font-bold text-primary tracking-wider">
                    {voucherCode}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  এই কোডটি "My Codes" সেকশনেও সেভ আছে।
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-4 flex-wrap">
              <Link to="/orders">
                <Button variant="outline">অর্ডার দেখুন</Button>
              </Link>
              {(voucherCode || resultType === "product") && (
                <Link to="/codes">
                  <Button variant="outline">My Codes</Button>
                </Link>
              )}
              <Link to="/">
                <Button>হোমে যান</Button>
              </Link>
            </div>
          </div>
        )}

        {(status === "failed" || status === "cancelled") && (
          <div className="space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-destructive">
              {status === "cancelled" ? "বাতিল" : "ব্যর্থ"}
            </h1>
            <p className="text-muted-foreground">{message}</p>
            <Link to="/">
              <Button className="mt-4">হোমে ফিরে যান</Button>
            </Link>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default PaymentCallback;
