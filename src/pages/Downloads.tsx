import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, ChevronRight, Download, FileIcon } from "lucide-react";
import { toast } from "sonner";

interface Purchase {
  id: string;
  amount: number;
  created_at: string;
  digital_product_id: string;
}

interface DigitalProduct {
  id: string;
  name: string;
  image_url: string | null;
  file_url: string | null;
  file_type: string | null;
  category: string;
}

const Downloads = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Record<string, DigitalProduct>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }
      const { data: pData } = await supabase
        .from("digital_purchases")
        .select("id, amount, created_at, digital_product_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pData && pData.length > 0) {
        setPurchases(pData);
        const ids = [...new Set(pData.map(p => p.digital_product_id))];
        const { data: prods } = await supabase
          .from("digital_products")
          .select("id, name, image_url, file_url, file_type, category")
          .in("id", ids);
        if (prods) {
          const map: Record<string, DigitalProduct> = {};
          prods.forEach(p => { map[p.id] = p; });
          setProducts(map);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleDownload = async (fileUrl: string) => {
    const { data, error } = await supabase.storage.from("digital-files").createSignedUrl(fileUrl, 300);
    if (error || !data?.signedUrl) { toast.error("ডাউনলোড লিংক তৈরি হয়নি"); return; }
    window.open(data.signedUrl, "_blank");
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
          <span className="text-foreground">Downloads</span>
        </nav>

        <div className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-bold text-lg mb-4">My Downloads</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !user ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-3">ডাউনলোড দেখতে লগইন করুন</p>
              <Link to="/login"><Button>Login</Button></Link>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <Download className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো ডাউনলোড নেই।</p>
              <Link to="/digital" className="mt-3 inline-block">
                <Button variant="outline">ডিজিটাল শপে যান</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map(p => {
                const prod = products[p.digital_product_id];
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                    {prod?.image_url ? (
                      <img src={prod.image_url} className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{prod?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("bn-BD")} • ৳{p.amount} • {prod?.file_type?.toUpperCase() || "FILE"}
                      </p>
                    </div>
                    {prod?.file_url && (
                      <Button size="sm" variant="outline" onClick={() => handleDownload(prod.file_url!)} className="gap-1 shrink-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Downloads;
