import { useState } from "react";
import { Home, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AddMoney = () => {
  const [amount, setAmount] = useState("");
  const { user, profile, loading } = useAuth();
  const { settings } = useSiteSettings();
  const [processing, setProcessing] = useState(false);
  
  // Safely get video URL with proper fallback
  const getVideoUrl = () => {
    if (!settings.video_tutorial_url) {
      return "https://www.youtube.com/embed/dQw4w9WgXcQ"; // Default fallback
    }
    
    const url = settings.video_tutorial_url.trim();
    
    // If it's a YouTube URL, ensure it's in embed format
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Convert regular YouTube URLs to embed format
      if (url.includes('watch?v=')) {
        return url.replace('watch?v=', 'embed/');
      }
      if (url.includes('youtu.be/') && !url.includes('embed/')) {
        const videoId = url.split('youtu.be/')[1];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    }
    
    // If it looks like a storage URL, show error instead
    if (url.includes('supabase.co/storage')) {
      console.error("Invalid storage URL detected:", url);
      return "https://www.youtube.com/embed/dQw4w9WgXcQ"; // Fallback
    }
    
    return url;
  };
  
  const videoUrl = getVideoUrl();

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("সঠিক পরিমাণ দিন");
      return;
    }

    setProcessing(true);
    try {
      const redirectUrl = `${window.location.origin}/payment-callback`;

      console.log("Creating add-money payment:", {
        type: "add_money",
        amount: Number(amount),
        product_name: "Wallet Deposit",
        package_info: `৳${amount} Deposit`,
        full_name: profile?.display_name || "Customer",
        redirect_url: redirectUrl,
      });

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          type: "add_money",
          amount: Number(amount),
          product_name: "Wallet Deposit",
          package_info: `৳${amount} Deposit`,
          full_name: profile?.display_name || "Customer",
          redirect_url: redirectUrl,
        },
      });

      console.log("Payment function response:", { data, error });

      if (error || !data?.payment_url) {
        console.error("Payment creation failed:", error);
        toast.error(data?.error || "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।");
        setProcessing(false);
        return;
      }

      window.location.href = data.payment_url;
    } catch (err) {
      console.error("Payment creation error:", err);
      toast.error(err instanceof Error ? err.message : "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-3 space-y-5 pb-24">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
          <ChevronRight className="h-3 w-3" />
          <span>Account</span>
          <ChevronRight className="h-3 w-3" />
          <span>Wallet</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Deposit</span>
        </nav>

        <section className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-bold text-lg mb-4">Add Money via UddoktaPay</h2>
          {profile && (
            <p className="text-sm text-muted-foreground mb-3">
              বর্তমান ব্যালেন্স: <span className="text-primary font-bold">৳{profile.balance}</span>
            </p>
          )}
          <label className="text-sm font-bold block mb-2">Amount</label>
          <Input
            placeholder="Enter amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="mb-4"
          />
          {!loading && user ? (
            <Button
              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={processing}
            >
              {processing ? "প্রসেসিং..." : "পেমেন্ট করুন"}
            </Button>
          ) : (
            <Link to="/login">
              <Button className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                Please Login
              </Button>
            </Link>
          )}
        </section>

        <section className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-bold text-lg mb-4">টিউটোরিয়াল</h2>
          <div className="rounded-xl overflow-hidden aspect-video bg-muted relative">
            {videoUrl ? (
              <iframe
                className="w-full h-full"
                src={videoUrl}
                title="Tutorial Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={(e) => {
                  console.error("Video iframe failed to load:", e);
                  // @ts-ignore - Fallback handling
                  e.target.src = "https://www.youtube.com/embed/dQw4w9WgXcQ";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">📹</div>
                  <p className="text-sm">ভিডিও সেট করা হয়নি</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ভিডিও লোড না হলে পেজ রিফ্রেশ করুন
          </p>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default AddMoney;
