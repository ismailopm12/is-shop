import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid reset link");
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("পাসওয়ার্ড আপডেট হয়েছে!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-md mx-auto px-4 py-8 pb-24">
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h1 className="text-xl font-bold text-center mb-6">নতুন পাসওয়ার্ড সেট করুন</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="password" placeholder="নতুন পাসওয়ার্ড" value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full bg-foreground text-background font-bold" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default ResetPassword;
