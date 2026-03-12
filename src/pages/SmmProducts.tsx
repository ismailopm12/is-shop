import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface SmmProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  min_quantity: number;
  max_quantity: number;
}

const SmmProducts = () => {
  const [products, setProducts] = useState<SmmProduct[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("smm_products")
        .select("id, name, category, price, image_url, min_quantity, max_quantity")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setProducts(data);
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
          <span className="text-foreground">SMM Services</span>
        </nav>

        <h1 className="text-xl font-bold">SMM Services</h1>

        {categories.map(cat => (
          <div key={cat}>
            <h2 className="text-lg font-bold mb-3">{cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.filter(p => p.category === cat).map(p => (
                <Link key={p.id} to={`/smm/${p.id}`} className="group">
                  <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow bg-card">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <span className="text-3xl">📱</span>
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">Min: {p.min_quantity}</span>
                        <span className="text-xs font-bold text-primary">৳{p.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">কোনো SMM সার্ভিস নেই।</div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default SmmProducts;
