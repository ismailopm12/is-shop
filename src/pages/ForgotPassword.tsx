import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get site name for email subject
      const siteName = "Sweet Build"; // Main website name
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, // Will redirect here after clicking email link
      });
      
      if (error) {
        console.error("Reset password error:", error);
        // Don't reveal if email exists or not for security
        toast.success(`যদি এই ইমেইলটি রেজিস্টার্ড থাকে, তাহলে পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে!`);
        setSent(true);
        setLoading(false);
        return;
      }
      
      toast.success(`যদি এই ইমেইলটি রেজিস্টার্ড থাকে, তাহলে পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে!`);
      setSent(true);
    } catch (err: any) {
      console.error("Reset password error:", err);
      toast.error("সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-md mx-auto px-4 py-8 pb-24">
        <Card className="card-shadow">
          <CardContent className="p-6 space-y-6">
            {!sent ? (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">পাসওয়ার্ড রিসেট</h1>
                  <p className="text-sm text-muted-foreground">
                    আপনার রেজিস্টার্ড ইমেইল দিন, আমরা পাসওয়ার্ড রিসেট লিঙ্ক পাঠাব
                  </p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">ইমেইল</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="আপনার ইমেইল দিন"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? "পাঠানো হচ্ছে..." : "পাসওয়ার্ড রিসেট লিঙ্ক পান"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-5xl">📧</div>
                <h2 className="text-xl font-bold text-foreground">ইমেইল চেক করুন!</h2>
                <p className="text-sm text-muted-foreground">
                  আমরা পাসওয়ার্ড রিসেট লিঙ্ক পাঠিয়েছি:<br/>
                  <strong className="text-foreground">{email}</strong>
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ✉️ <strong>ইমেইল সাবজেক্ট:</strong><br/>
                    "পাসওয়ার্ড রিসেট - Sweet Build"
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = "/login"}
                  variant="outline"
                  className="w-full"
                >
                  লগইন পেজে যান
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
};

export default ForgotPassword;
