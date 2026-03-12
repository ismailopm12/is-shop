import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("রিসেট লিংক পাঠানো হয়েছে!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-md mx-auto px-4 py-8 pb-24">
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h1 className="text-xl font-bold text-center mb-6">পাসওয়ার্ড রিসেট</h1>
          {sent ? (
            <p className="text-center text-muted-foreground">আপনার ইমেইলে রিসেট লিংক পাঠানো হয়েছে। অনুগ্রহ করে চেক করুন।</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full bg-foreground text-background font-bold" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default ForgotPassword;
