import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileIcon, Download, CheckCircle } from "lucide-react";

interface DigitalProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  file_url: string | null;
  file_type: string | null;
}

const DigitalProductDetail = () => {
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "instant">("instant");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("digital_products")
        .select("id, name, description, category, price, image_url, file_url, file_type")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (data) setProduct(data);

      if (user && id) {
        const { data: purchase } = await supabase
          .from("digital_purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("digital_product_id", id)
          .maybeSingle();
        if (purchase) setAlreadyPurchased(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const completePurchase = async (productData: DigitalProduct) => {
    if (!user) return;
    // Record purchase
    const { error } = await supabase.from("digital_purchases").insert({
      user_id: user.id,
      digital_product_id: productData.id,
      amount: productData.price,
    });
    if (error) return false;

    // Record transaction
    await supabase.from("payment_records").insert({
      user_id: user.id,
      amount: productData.price,
      type: "digital",
      status: "completed",
    });
    return true;
  };

  const handleWalletPurchase = async () => {
    if (!user || !product || !profile) return;
    if (profile.balance < product.price) {
      toast.error("ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। Add Money করুন।");
      return;
    }
    setPurchasing(true);

    // Deduct balance
    const newBalance = profile.balance - product.price;
    await supabase.from("profiles").update({ balance: newBalance }).eq("user_id", user.id);

    const success = await completePurchase(product);
    if (!success) {
      // Refund
      await supabase.from("profiles").update({ balance: profile.balance }).eq("user_id", user.id);
      toast.error("কেনা যায়নি");
      setPurchasing(false);
      refreshProfile();
      return;
    }

    toast.success("কেনা সফল! Downloads থেকে ডাউনলোড করুন।");
    setAlreadyPurchased(true);
    refreshProfile();
    setPurchasing(false);
  };

  const handleInstantPay = async () => {
    if (!user || !product || !profile) return;
    setPurchasing(true);
    try {
      const redirectUrl = `${window.location.origin}/payment-callback`;
      
      console.log("Creating digital product payment:", {
        type: "digital",
        product_name: product.name,
        package_info: `Digital: ${product.name}`,
        amount: product.price,
        product_id: product.id,
        full_name: profile?.display_name || "Customer",
        redirect_url: redirectUrl,
      });
      
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          type: "digital",
          product_name: product.name,
          package_info: `Digital: ${product.name}`,
          amount: product.price,
          product_id: product.id,
          full_name: profile?.display_name || "Customer",
          redirect_url: redirectUrl,
        },
      });

      console.log("Payment function response:", { data, error });

      if (error || !data?.payment_url) {
        console.error("Payment creation failed:", error);
        toast.error(data?.error || "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।");
        setPurchasing(false);
        return;
      }
      window.location.href = data.payment_url;
    } catch (err) {
      console.error("Payment creation error:", err);
      toast.error(err instanceof Error ? err.message : "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।");
      setPurchasing(false);
    }
  };

  const handlePurchase = () => {
    if (paymentMethod === "wallet") handleWalletPurchase();
    else handleInstantPay();
  };

  const handleDownload = async () => {
    if (!product?.file_url) return;
    const { data, error } = await supabase.storage.from("digital-files").createSignedUrl(product.file_url, 300);
    if (error || !data?.signedUrl) { toast.error("ডাউনলোড লিংক তৈরি হয়নি"); return; }
    window.open(data.signedUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) return <div className="p-8 text-center text-foreground">Product not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-4 pb-24 space-y-5">
        <div className="rounded-xl overflow-hidden card-shadow relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-52 object-cover" />
          ) : (
            <div className="w-full h-52 bg-muted flex items-center justify-center">
              <FileIcon className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent flex items-end p-4">
            <div>
              <h1 className="text-primary-foreground font-bold text-lg">{product.name}</h1>
              <p className="text-primary-foreground/70 text-sm">{product.category} • {product.file_type?.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <section className="bg-card rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">মূল্য</h2>
            <span className="text-2xl font-bold text-primary">৳{product.price}</span>
          </div>

          {alreadyPurchased ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary bg-accent p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">আপনি এটি কিনেছেন!</span>
              </div>
              {product.file_url && (
                <Button onClick={handleDownload} className="w-full gap-2">
                  <Download className="h-4 w-4" /> ডাউনলোড করুন
                </Button>
              )}
            </div>
          ) : !user ? (
            <div>
              <p className="text-sm text-primary mb-2">ℹ️ কিনতে লগইন করুন</p>
              <Link to="/login"><Button className="w-full">LOGIN</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Method Selection */}
              <div>
                <h3 className="font-semibold text-sm mb-2">পেমেন্ট মেথড</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("wallet")}
                    className={`rounded-xl p-4 border-2 transition text-center ${
                      paymentMethod === "wallet" ? "border-primary bg-accent" : "border-border"
                    }`}
                  >
                    <span className="text-3xl">💰</span>
                    <p className="text-sm font-semibold mt-2">Pay With Wallet</p>
                    <p className="text-xs text-muted-foreground mt-1">৳{profile?.balance ?? 0}</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("instant")}
                    className={`rounded-xl p-4 border-2 transition text-center ${
                      paymentMethod === "instant" ? "border-primary bg-accent" : "border-border"
                    }`}
                  >
                    <span className="text-3xl">⚡</span>
                    <p className="text-sm font-semibold mt-2">Instant Pay</p>
                    <p className="text-xs text-muted-foreground mt-1">UddoktaPay</p>
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-1">
                ℹ️ প্রোডাক্ট কিনতে আপনার প্রয়োজন <span className="text-secondary font-bold">৳{product.price}</span> টাকা।
              </p>

              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full bg-primary text-primary-foreground font-bold"
              >
                {purchasing ? "প্রসেসিং..." : `৳${product.price} দিয়ে কিনুন`}
              </Button>
            </div>
          )}
        </section>

        {product.description && (
          <section className="bg-card rounded-xl p-5 card-shadow">
            <h2 className="font-bold text-lg mb-3 border-b border-border pb-2">বিবরণ</h2>
            <div className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</div>
          </section>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default DigitalProductDetail;
