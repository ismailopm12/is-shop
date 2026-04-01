import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("=== START: Fetching products...");
        console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
        console.log("Current host:", window.location.hostname);
        console.log("Current port:", window.location.port);
        
        // Test Supabase connection
        const { data: testConnection, error: testError } = await supabase
          .from("products")
          .select("id")
          .limit(1);
        
        if (testError) {
          console.error("❌ Supabase connection test failed:", testError);
          setError(`Database connection failed: ${testError.message}`);
          setLoading(false);
          return;
        }
        
        console.log("✅ Supabase connection successful");
        
        // Select ALL fields to match TypeScript requirements
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, image, image_url, category, description, is_active, is_voucher, created_at, updated_at")
          .eq("is_active", true)
          .order("created_at");
        
        console.log("Raw response:", { data, error });
        
        if (error) {
          console.error("❌ Error fetching products:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          setError(`Failed to load products: ${error.message}`);
          return;
        }
        
        if (data) {
          console.log(`✅ Success! Fetched ${data.length} products`);
          console.log("Categories found:", [...new Set(data.map(p => p.category))]);
          
          // Check if products table might be empty
          if (data.length === 0) {
            console.warn("⚠️ Products table is empty or no active products");
            const { count } = await supabase.from("products").select("*", { count: 'exact', head: true });
            console.log("Total products in DB (including inactive):", count);
          }
          
          // Validate data before setting
          const validProducts = data.filter(p => {
            if (!p.id || !p.name || !p.slug || !p.category) {
              console.warn("⚠️ Invalid product data:", p);
              return false;
            }
            return true;
          });
          
          console.log(`Valid products: ${validProducts.length} out of ${data.length}`);
          setProducts(validProducts as Product[]);
        } else {
          console.warn("⚠️ No products found");
          setProducts([]);
        }
      } catch (err: any) {
        console.error("❌ Unexpected error fetching products:", err);
        console.error("Error stack:", err.stack);
        setError(`Failed to load products: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
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
    <div className="w-full px-3 sm:px-4 mt-6 space-y-8">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Products</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            🔄 Reload Page
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">প্রোডাক্টসমূহ</h3>
          <p className="text-muted-foreground">কোনো প্রোডাক্ট নেই</p>
        </div>
      ) : (
        categories.map((cat, index) => (
          <div key={cat} className="space-y-4">
            <h2 className="text-lg font-bold text-center mb-6 relative">
              {cat}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-primary rounded-full"></div>
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              {products.filter(p => p.category === cat).map(product => (
                <Link key={product.id} to={`/product/${product.slug}`} className="group">
                  <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow">
                    <img src={getImage(product)} alt={product.name} className="w-full aspect-square object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-center mt-2">{product.name}</p>
                </Link>
              ))}
            </div>
            {index < categories.length - 1 && <div className="h-8"></div>}
          </div>
        ))
      )}
    </div>
  );
};

export default ProductGrid;
