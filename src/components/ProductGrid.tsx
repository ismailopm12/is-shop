import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import uidTopup from "@/assets/uid-topup.jpg";
import unipinVoucher from "@/assets/unipin-voucher.jpg";
import weeklyMonthly from "@/assets/weekly-monthly.jpg";
import { Gamepad2, CreditCard, Calendar } from "lucide-react";

const localImageMap: Record<string, string> = {
  "uid-topup": uidTopup,
  "unipin-voucher": unipinVoucher,
  "weekly-monthly": weeklyMonthly,
};

// Category icons mapping
const categoryIcons: Record<string, any> = {
  "Free Fire": Gamepad2,
  "UID Top-up": CreditCard,
  "Weekly/Monthly": Calendar,
};

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  image_url: string | null;
  category: string;
  price?: number;
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

  if (products.length === 0) return null;

  return (
    <div className="px-4 mt-6">
      {categories.map(cat => {
        const categoryProducts = products.filter(p => p.category === cat);
        const IconComponent = categoryIcons[cat] || Gamepad2;

        return (
          <div key={cat} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{cat}</h2>
              </div>
              <Link to="/" className="text-sm text-primary font-medium hover:underline">
                সব দেখুন →
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {categoryProducts.map(product => (
                <Link key={product.id} to={`/product/${product.slug}`} className="group">
                  <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow bg-card">
                    <div className="relative">
                      <img 
                        src={getImage(product)} 
                        alt={product.name} 
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground uppercase">{product.category}</span>
                        {product.price && (
                          <span className="text-xs font-bold text-primary">৳{product.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
