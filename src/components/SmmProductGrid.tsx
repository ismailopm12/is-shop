import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SmmProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
}

const SmmProductGrid = () => {
  const [products, setProducts] = useState<SmmProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        console.log("Fetching SMM products...");
        const { data, error } = await supabase
          .from("smm_products")
          .select("id, name, category, price, image_url")
          .eq("is_active", true)
          .order("sort_order")
          .limit(6);
        
        if (error) {
          console.error("Error fetching SMM products:", error);
          setError(error.message);
          return;
        }
        
        if (data) {
          console.log("SMM products fetched:", data.length);
          setProducts(data);
        } else {
          console.warn("No SMM products found");
          setProducts([]);
        }
      } catch (err) {
        console.error("Unexpected error fetching SMM products:", err);
        setError("Failed to load SMM products");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="px-4 mt-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 mt-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading SMM Products</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="w-full px-3 sm:px-4 mt-6 space-y-4">
      <h2 className="text-lg font-bold text-center mb-6 relative">
        এসএমএম সার্ভিস
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-primary rounded-full"></div>
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {products.map(p => (
          <Link key={p.id} to={`/smm/${p.id}`} className="group">
            <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                  <span className="text-3xl">📱</span>
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-center mt-2">{p.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SmmProductGrid;
