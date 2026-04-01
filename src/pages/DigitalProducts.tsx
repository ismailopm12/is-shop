import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Home, ChevronRight, FileIcon } from "lucide-react";

interface DigitalProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  file_type: string | null;
}

const DigitalProducts = () => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        console.log("Fetching digital products...");
        const { data, error } = await supabase
          .from("digital_products")
          .select("id, name, category, price, image_url, file_type")
          .eq("is_active", true)
          .order("created_at");
        
        if (error) {
          console.error("Error fetching digital products:", error);
          setError(error.message);
          return;
        }
        
        if (data) {
          console.log("Digital products fetched:", data.length);
          setProducts(data);
        } else {
          console.warn("No digital products found");
          setProducts([]);
        }
      } catch (err) {
        console.error("Unexpected error fetching digital products:", err);
        setError("Failed to load digital products");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-3 pb-24 space-y-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Digital Downloads</span>
        </nav>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Products</h3>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">কোনো ডিজিটাল প্রোডাক্ট নেই</div>
        ) : (
          categories.map(cat => (
            <div key={cat}>
              <h2 className="text-lg font-bold text-center mb-4">{cat}</h2>
              <div className="grid grid-cols-3 gap-3">
                {products.filter(p => p.category === cat).map(p => (
                  <Link key={p.id} to={`/digital/${p.id}`} className="group">
                    <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow bg-card">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square bg-muted flex items-center justify-center">
                          <FileIcon className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground uppercase">{p.file_type}</span>
                          <span className="text-sm font-bold text-primary">৳{p.price}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default DigitalProducts;
