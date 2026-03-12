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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("smm_products")
        .select("id, name, category, price, image_url")
        .eq("is_active", true)
        .order("sort_order")
        .limit(6);
      if (data) setProducts(data);
    };
    fetch();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">SMM Services</h2>
        <Link to="/smm" className="text-sm text-primary font-medium hover:underline">সব দেখুন →</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {products.map(p => (
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
                <span className="text-xs font-bold text-primary">৳{p.price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SmmProductGrid;
