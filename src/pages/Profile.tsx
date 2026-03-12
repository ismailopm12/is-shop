import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { ChevronRight, Home, ShieldCheck, Download, Settings, Upload, Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  status: string | null;
  type: string;
  created_at: string | null;
  invoice_id: string | null;
}

const Profile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const perPage = 10;

  useEffect(() => {
    const fetchTx = async () => {
      if (!user) { setTxLoading(false); return; }
      const { data } = await supabase
        .from("payment_records")
        .select("id, amount, status, type, created_at, invoice_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setTransactions(data);
      setTxLoading(false);
    };
    fetchTx();
  }, [user]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / perPage));
  const paginated = transactions.slice((page - 1) * perPage, page * perPage);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ইমেজ ফাইল আপলোড করুন");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `avatars/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        toast.error("আপলোড ব্যর্থ: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile avatar_url
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) {
        toast.error("প্রোফাইল আপডেট ব্যর্থ: " + updateError.message);
        setUploading(false);
        return;
      }

      toast.success("প্রোফাইল ইমেজ আপডেট হয়েছে!");
      await refreshProfile();
      setUploading(false);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error("প্রোফাইল ইমেজ আপলোড করতে সমস্যা হয়েছে");
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id);

      if (error) {
        toast.error("ছবি রিমুভ করতে সমস্যা হয়েছে");
        return;
      }

      toast.success("প্রোফাইল ছবি রিমুভ করা হয়েছে");
      await refreshProfile();
    } catch (err: any) {
      console.error("Remove avatar error:", err);
      toast.error("প্রোফাইল ছবি রিমুভ করতে সমস্যা হয়েছে");
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-md mx-auto px-4 py-12 text-center pb-24">
          <p className="text-muted-foreground mb-4">প্রোফাইল দেখতে লগইন করুন</p>
          <Link to="/login"><Button className="bg-foreground text-background">Login</Button></Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-3 pb-24 space-y-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Account</span>
        </nav>

        <div className="bg-card rounded-xl overflow-hidden card-shadow">
          <div className="h-32 relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-4 left-8 w-16 h-16 border-2 border-primary-foreground/40 rounded-full" />
              <div className="absolute top-10 right-12 w-8 h-8 border-2 border-primary-foreground/40 rounded-full" />
              <div className="absolute bottom-4 left-1/4 w-20 h-6 bg-primary-foreground/20 rounded-full rotate-12" />
              <div className="absolute top-2 right-1/3 w-12 h-12 bg-primary-foreground/10 rounded-lg rotate-45" />
              <div className="absolute bottom-6 right-8 w-10 h-10 bg-primary-foreground/15 rounded-full" />
            </div>
          </div>

          <div className="px-5 pb-6">
            <div className="relative inline-block mx-auto -mt-12">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url.replace(/=s\d+-c/, "=s256-c")}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-card mx-auto shadow-lg object-cover bg-card"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-card border-4 border-card mx-auto shadow-lg flex items-center justify-center text-2xl text-muted-foreground font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              
              {/* Upload/Remove Avatar Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="absolute bottom-0 right-0 flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition shadow-lg disabled:opacity-50"
                  title="Change profile picture"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                {profile?.avatar_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition shadow-lg disabled:opacity-50"
                    title="Remove profile picture"
                  >
                    <Upload className="h-4 w-4 rotate-180" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-center gap-2">
                <h2 className="font-bold text-lg">{profile?.display_name || "No Name?"}</h2>
                <span className="w-6 h-6 rounded bg-accent-foreground/80 flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">V</span>
                </span>
                <span className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
                </span>
                {!adminLoading && isAdmin && (
                  <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-white text-xs font-bold shadow-sm">
                    👑 Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">{user?.email || "No Email?"}</p>
              <p className="text-sm text-muted-foreground text-center">{profile?.phone || ""}</p>
            </div>

            <div className="border-t border-border my-4" />

            <div className="flex items-center justify-center gap-8 bg-muted/50 rounded-xl p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                <div className="bg-card border border-border rounded-lg px-4 py-2">
                  <span className="text-2xl font-bold">{profile?.balance ?? 0}৳</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Current Coins</p>
                <div className="bg-card border border-border rounded-lg px-4 py-2">
                  <span className="text-2xl">🪙 {profile?.coins ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-4">
              <Link to="/add-money">
                <Button className="bg-foreground text-background font-semibold hover:bg-foreground/90 px-8">
                  Add Money
                </Button>
              </Link>
              <Link to="/downloads">
                <Button variant="outline" className="font-semibold px-6 gap-2">
                  <Download className="h-4 w-4" /> Downloads
                </Button>
              </Link>
              {!adminLoading && isAdmin && (
                <Link to="/admin">
                  <Button variant="secondary" className="font-semibold px-6 gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0">
                    <Settings className="h-4 w-4" /> Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-bold text-lg mb-4">Recent Transactions</h3>
          {txLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 font-medium">তারিখ</th>
                      <th className="text-left py-2 font-medium">TrxId</th>
                      <th className="text-left py-2 font-medium">Amount</th>
                      <th className="text-left py-2 font-medium">Type</th>
                      <th className="text-left py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">No results.</td>
                      </tr>
                    ) : paginated.map(tx => (
                      <tr key={tx.id} className="border-b border-border/50">
                        <td className="py-3 text-muted-foreground">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString("bn-BD") : "—"}
                        </td>
                        <td className="py-3 font-mono text-xs">{tx.invoice_id?.slice(0, 12) || tx.id.slice(0, 8)}</td>
                        <td className="py-3 font-semibold">৳{tx.amount ?? 0}</td>
                        <td className="py-3 capitalize">{tx.type}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-muted text-muted-foreground'
                          }`}>{tx.status || "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-center gap-3 mt-4 text-sm">
                <span className="text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Profile;
