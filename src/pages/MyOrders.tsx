import { useEffect, useState } from "react";
import { Home, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: string;
  product_name: string;
  package_info: string;
  amount: number;
  status: string;
  created_at: string;
}

interface DigitalPurchase {
  id: string;
  amount: number;
  created_at: string;
  digital_products: { name: string } | null;
}

interface SmmOrder {
  id: string;
  product_name: string;
  quantity: number;
  amount: number;
  status: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "পেন্ডিং", className: "bg-yellow-100 text-yellow-800" },
  processing: { label: "প্রসেসিং", className: "bg-blue-100 text-blue-800" },
  completed: { label: "সম্পন্ন", className: "bg-green-100 text-green-800" },
  cancelled: { label: "বাতিল", className: "bg-red-100 text-red-800" },
};

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [digitalPurchases, setDigitalPurchases] = useState<DigitalPurchase[]>([]);
  const [smmOrders, setSmmOrders] = useState<SmmOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) { setLoading(false); return; }

      const [ordersRes, digitalRes, smmRes] = await Promise.all([
        supabase.from("orders").select("id, product_name, package_info, amount, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("digital_purchases").select("id, amount, created_at, digital_products(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("smm_orders").select("id, product_name, quantity, amount, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (digitalRes.data) setDigitalPurchases(digitalRes.data as any);
      if (smmRes.data) setSmmOrders(smmRes.data);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const EmptyState = () => (
    <div className="text-center py-12">
      <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground">কোনো অর্ডার নেই।</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-3 pb-24 space-y-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">My Orders</span>
        </nav>

        <div className="bg-card rounded-xl p-5 card-shadow">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !user ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-3">অর্ডার দেখতে লগইন করুন</p>
              <Link to="/login"><Button>Login</Button></Link>
            </div>
          ) : (
            <Tabs defaultValue="products">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="products">প্রোডাক্ট</TabsTrigger>
                <TabsTrigger value="digital">ডিজিটাল</TabsTrigger>
                <TabsTrigger value="smm">SMM</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                {orders.length === 0 ? <EmptyState /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 font-medium">তারিখ</th>
                          <th className="text-left py-2 font-medium">প্রোডাক্ট</th>
                          <th className="text-left py-2 font-medium">প্যাকেজ</th>
                          <th className="text-left py-2 font-medium">মূল্য</th>
                          <th className="text-left py-2 font-medium">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => {
                          const s = statusMap[o.status] || { label: o.status, className: "" };
                          return (
                            <tr key={o.id} className="border-b border-border/50">
                              <td className="py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("bn-BD")}</td>
                              <td className="py-3 font-medium">{o.product_name}</td>
                              <td className="py-3">{o.package_info}</td>
                              <td className="py-3">৳{o.amount}</td>
                              <td className="py-3"><Badge className={s.className}>{s.label}</Badge></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="digital">
                {digitalPurchases.length === 0 ? <EmptyState /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 font-medium">তারিখ</th>
                          <th className="text-left py-2 font-medium">প্রোডাক্ট</th>
                          <th className="text-left py-2 font-medium">মূল্য</th>
                          <th className="text-left py-2 font-medium">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody>
                        {digitalPurchases.map(d => (
                          <tr key={d.id} className="border-b border-border/50">
                            <td className="py-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString("bn-BD")}</td>
                            <td className="py-3 font-medium">{(d.digital_products as any)?.name || "—"}</td>
                            <td className="py-3">৳{d.amount}</td>
                            <td className="py-3"><Badge className="bg-green-100 text-green-800">সম্পন্ন</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="smm">
                {smmOrders.length === 0 ? <EmptyState /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 font-medium">তারিখ</th>
                          <th className="text-left py-2 font-medium">প্রোডাক্ট</th>
                          <th className="text-left py-2 font-medium">পরিমাণ</th>
                          <th className="text-left py-2 font-medium">মূল্য</th>
                          <th className="text-left py-2 font-medium">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody>
                        {smmOrders.map(o => {
                          const s = statusMap[o.status] || { label: o.status, className: "" };
                          return (
                            <tr key={o.id} className="border-b border-border/50">
                              <td className="py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("bn-BD")}</td>
                              <td className="py-3 font-medium">{o.product_name}</td>
                              <td className="py-3">{o.quantity}</td>
                              <td className="py-3">৳{o.amount}</td>
                              <td className="py-3"><Badge className={s.className}>{s.label}</Badge></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default MyOrders;
