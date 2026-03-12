import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SmmProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  image_url: string | null;
  min_quantity: number;
  max_quantity: number;
}

const SmmProductDetail = () => {
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [product, setProduct] = useState<SmmProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [targetLink, setTargetLink] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "instant">("instant");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("smm_products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (data) {
        setProduct(data);
        setQuantity(data.min_quantity);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!product) return <div className="p-8 text-center text-foreground">Product not found</div>;

  const totalPrice = product.price * quantity;

  const handleOrder = async () => {
    if (!user) return;
    if (!targetLink.trim()) { toast.error("টার্গেট লিংক দিন"); return; }
    if (quantity < product.min_quantity || quantity > product.max_quantity) {
      toast.error(`পরিমাণ ${product.min_quantity} - ${product.max_quantity} এর মধ্যে হতে হবে`);
      return;
    }

    if (paymentMethod === "wallet") {
      if (!profile || profile.balance < totalPrice) {
        toast.error("ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।");
        return;
      }
      setOrdering(true);

      const { error } = await supabase.from("smm_orders").insert({
        user_id: user.id,
        smm_product_id: product.id,
        product_name: product.name,
        quantity,
        target_link: targetLink,
        amount: totalPrice,
        status: "pending",
      });

      if (error) { toast.error("অর্ডার করতে সমস্যা হয়েছে"); setOrdering(false); return; }

      await supabase.from("profiles").update({ balance: profile.balance - totalPrice }).eq("user_id", user.id);
      toast.success("SMM অর্ডার সফল হয়েছে!");
      refreshProfile();
      setOrdering(false);
    } else {
      setOrdering(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-payment", {
          body: {
            type: "smm",
            product_name: product.name,
            amount: totalPrice,
            smm_product_id: product.id,
            quantity,
            target_link: targetLink,
            full_name: profile?.display_name || "Customer",
            redirect_url: `${window.location.origin}/payment-callback`,
          },
        });
        if (error || !data?.payment_url) { toast.error("পেমেন্ট তৈরি করতে সমস্যা হয়েছে।"); setOrdering(false); return; }
        window.location.href = data.payment_url;
      } catch {
        toast.error("পেমেন্ট তৈরি করতে সমস্যা হয়েছে।");
        setOrdering(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-5 pb-24">
        <div className="rounded-xl overflow-hidden card-shadow relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-44 object-cover" />
          ) : (
            <div className="w-full h-44 bg-muted flex items-center justify-center"><span className="text-5xl">📱</span></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent flex items-end p-4">
            <div>
              <h1 className="text-primary-foreground font-bold text-lg">{product.name}</h1>
              <p className="text-primary-foreground/70 text-sm">{product.category}</p>
            </div>
          </div>
        </div>

        <section className="bg-card rounded-xl p-4 card-shadow space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
            <h2 className="font-bold">অর্ডার তথ্য</h2>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">টার্গেট লিংক</label>
            <Input placeholder="https://..." value={targetLink} onChange={e => setTargetLink(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">পরিমাণ (Min: {product.min_quantity}, Max: {product.max_quantity})</label>
            <Input type="number" min={product.min_quantity} max={product.max_quantity} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <p className="text-sm text-muted-foreground">প্রতি একটি: ৳{product.price} | মোট: <span className="text-primary font-bold">৳{totalPrice}</span></p>
        </section>

        <section className="bg-card rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
            <h2 className="font-bold">Payment Methods</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPaymentMethod("wallet")} className={`rounded-xl p-4 border-2 transition text-center ${paymentMethod === "wallet" ? "border-primary bg-accent" : "border-border"}`}>
              <span className="text-3xl">💰</span>
              <p className="text-sm font-semibold mt-2">Pay With Wallet</p>
              {profile && <p className="text-xs text-muted-foreground mt-1">৳{profile.balance}</p>}
            </button>
            <button onClick={() => setPaymentMethod("instant")} className={`rounded-xl p-4 border-2 transition text-center ${paymentMethod === "instant" ? "border-primary bg-accent" : "border-border"}`}>
              <span className="text-3xl">⚡</span>
              <p className="text-sm font-semibold mt-2">Instant Pay</p>
              <p className="text-xs text-muted-foreground mt-1">UddoktaPay</p>
            </button>
          </div>
          {user ? (
            <Button onClick={handleOrder} disabled={ordering} className="w-full mt-4 bg-primary text-primary-foreground font-bold hover:bg-primary/90">
              {ordering ? "প্রসেসিং..." : `অর্ডার করুন - ৳${totalPrice}`}
            </Button>
          ) : (
            <Link to="/login"><Button className="w-full mt-4">LOGIN করুন</Button></Link>
          )}
        </section>

        {product.description && (
          <section className="bg-card rounded-xl p-4 card-shadow">
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

export default SmmProductDetail;
