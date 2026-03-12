import { useEffect, useState } from "react";
import { Home, ChevronRight, Snowflake, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VoucherWithProduct {
  id: string;
  code: string;
  status: string;
  assigned_at: string | null;
  created_at: string;
  product_id: string;
  package_id: string | null;
}

const MyCodes = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<VoucherWithProduct[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [packageNames, setPackageNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCodes = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("voucher_codes")
        .select("id, code, status, assigned_at, created_at, product_id, package_id")
        .eq("user_id", user.id)
        .eq("status", "assigned")
        .order("assigned_at", { ascending: false });

      if (data && data.length > 0) {
        setCodes(data as VoucherWithProduct[]);
        // Fetch product names
        const productIds = [...new Set(data.map(d => d.product_id))];
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        if (products) {
          const map: Record<string, string> = {};
          products.forEach(p => { map[p.id] = p.name; });
          setProductNames(map);
        }
        // Fetch package names
        const packageIds = [...new Set(data.filter(d => d.package_id).map(d => d.package_id!))];
        if (packageIds.length > 0) {
          const { data: pkgs } = await supabase
            .from("diamond_packages")
            .select("id, diamonds, price")
            .in("id", packageIds);
          if (pkgs) {
            const pMap: Record<string, string> = {};
            pkgs.forEach(p => { pMap[p.id] = `Package ${p.diamonds} - ৳${p.price}`; });
            setPackageNames(pMap);
          }
        }
      }
      setLoading(false);
    };
    fetchCodes();
  }, [user]);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("কোড কপি হয়েছে!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-3 pb-24 space-y-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
          <ChevronRight className="h-3 w-3" />
          <span>Account</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">My Codes</span>
        </nav>

        <div className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-bold text-lg mb-4">My Codes</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !user ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-3">কোড দেখতে লগইন করুন</p>
              <Link to="/login"><Button>Login</Button></Link>
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-12">
              <Snowflake className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো কোড নেই।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">তারিখ</th>
                    <th className="text-left py-2 font-medium">কোড</th>
                    <th className="text-left py-2 font-medium">প্রোডাক্ট</th>
                    <th className="text-left py-2 font-medium">ভ্যারিয়েন্ট</th>
                    <th className="text-left py-2 font-medium">কপি</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-3 text-muted-foreground">
                        {c.assigned_at ? new Date(c.assigned_at).toLocaleDateString("bn-BD") : "—"}
                      </td>
                      <td className="py-3 font-mono font-semibold text-foreground">{c.code}</td>
                      <td className="py-3">{productNames[c.product_id] || "—"}</td>
                      <td className="py-3 text-xs text-muted-foreground">{c.package_id ? (packageNames[c.package_id] || "—") : "—"}</td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCode(c.id, c.code)}
                        >
                          {copiedId === c.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default MyCodes;
