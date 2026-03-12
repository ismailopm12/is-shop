import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileIcon } from "lucide-react";

interface DigitalProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  file_type: string | null;
}

const DigitalProductGrid = () => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("digital_products")
        .select("id, name, category, price, image_url, file_type")
        .eq("is_active", true)
        .order("created_at")
        .limit(6);
      if (data) setProducts(data);
    };
    fetch();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="px-4 mt-6">
      <h2 className="text-lg font-bold text-center mb-4">ডিজিটাল ডাউনলোডস</h2>
      <div className="grid grid-cols-3 gap-3">
        {products.map(p => (
          <Link key={p.id} to={`/digital/${p.id}`} className="group">
            <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
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

export default DigitalProductGrid;
