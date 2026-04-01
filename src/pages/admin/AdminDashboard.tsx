import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, Coins } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("amount"),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalRevenue: ordersRes.data?.reduce((sum, o) => sum + Number(o.amount), 0) || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "মোট ইউজার", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "মোট প্রোডাক্ট", value: stats.totalProducts, icon: Package, color: "text-green-500" },
    { title: "মোট অর্ডার", value: stats.totalOrders, icon: ShoppingCart, color: "text-orange-500" },
    { title: "মোট রেভিনিউ", value: `৳${stats.totalRevenue}`, icon: Coins, color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground px-2 md:px-0">ড্যাশবোর্ড</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {cards.map((card) => (
            <Card key={card.title} className="card-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-6">
                <CardTitle className="text-xs md:text-sm lg:text-base font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${card.color}`} />
              </CardHeader>
              <CardContent className="px-3 md:px-6 pt-0 md:pt-2">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
