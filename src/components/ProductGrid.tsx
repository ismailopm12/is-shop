import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import uidTopup from "@/assets/uid-topup.jpg";
import unipinVoucher from "@/assets/unipin-voucher.jpg";
import weeklyMonthly from "@/assets/weekly-monthly.jpg";

const localImageMap: Record<string, string> = {
  "uid-topup": uidTopup,
  "unipin-voucher": unipinVoucher,
  "weekly-monthly": weeklyMonthly,
};

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  image_url: string | null;
  category: string;
}

const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, image, image_url, category")
        .eq("is_active", true)
        .order("created_at");
      if (data) setProducts(data as Product[]);
    };
    fetchProducts();
  }, []);

  const getImage = (p: Product) => {
    if (p.image_url) return p.image_url;
    if (p.image && localImageMap[p.image]) return localImageMap[p.image];
    return "/placeholder.svg";
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="px-4 mt-6">
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">প্রোডাক্টসমূহ</h3>
          <p className="text-muted-foreground">কোনো প্রোডাক্ট নেই</p>
        </div>
      ) : (
        categories.map(cat => (
          <div key={cat}>
            <h2 className="text-lg font-bold text-center mb-4">{cat}</h2>
            <div className="grid grid-cols-3 gap-3">
              {products.filter(p => p.category === cat).map(product => (
                <Link key={product.id} to={`/product/${product.slug}`} className="group">
                  <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow">
                    <img src={getImage(product)} alt={product.name} className="w-full aspect-square object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-center mt-2">{product.name}</p>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProductGrid;
