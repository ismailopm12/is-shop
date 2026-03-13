import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Edit, Eye, TrendingUp, Activity, Users, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  balance: number;
  coins: number;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
  last_active?: string;
}

interface ProductWithViews {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  view_count: number;
  order_count: number;
  conversion_rate: number;
  is_active: boolean;
}

const AnimatedCounter = ({ value, duration = 1 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

const AdminUsersEnhanced = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editCoins, setEditCoins] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewStats, setViewStats] = useState({
    totalViews: 0,
    liveViews: 0,
    uniqueVisitors: 0,
  });

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch users with order statistics
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesData) {
      // Get order stats for each user
      const usersWithStats = await Promise.all(
        profilesData.map(async (profile) => {
          const { count: orderCount } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", profile.user_id);

          const { data: orders } = await supabase
            .from("orders")
            .select("amount")
            .eq("user_id", profile.user_id);

          const totalSpent = orders?.reduce((sum, o) => sum + Number(o.amount || 0), 0) || 0;

          return {
            ...profile,
            total_orders: orderCount || 0,
            total_spent: totalSpent,
          };
        })
      );

      setUsers(usersWithStats);
    }
    setLoading(false);
  };

  const fetchViewStats = async () => {
    // Fetch total views across all products
    const { data: products } = await supabase
      .from("products")
      .select("view_count");

    const totalViews = products?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

    // Fetch live views (last 5 minutes)
    const { count: liveCount } = await supabase
      .from("product_views")
      .select("id", { count: "exact", head: true })
      .gt("viewed_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Count unique visitors
    const { count: uniqueCount } = await supabase
      .from("product_views")
      .select("user_id", { count: "distinct", head: true });

    setViewStats({
      totalViews,
      liveViews: liveCount || 0,
      uniqueVisitors: uniqueCount || 0,
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchViewStats();
    
    // Update live views every 10 seconds
    const interval = setInterval(fetchViewStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = users.filter(u =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
  );

  const handleUpdateUser = async () => {
    if (!editUser) return;
    const { error } = await supabase.from("profiles").update({
      balance: parseFloat(editBalance),
      coins: parseInt(editCoins),
    }).eq("id", editUser.id);

    if (error) { 
      toast.error("আপডেট ব্যর্থ হয়েছে"); 
      return; 
    }
    toast.success("ইউজার আপডেট হয়েছে");
    setEditUser(null);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              ইউজার ম্যানেজমেন্ট
            </h2>
            <p className="text-muted-foreground mt-1">সকল ব্যবহারকারীর বিস্তারিত তথ্য এবং পরিসংখ্যান</p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {users.length} জন ইউজার
          </Badge>
        </div>

        {/* Animated View Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="card-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  মোট ভিউ
                </CardTitle>
                <Eye className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-blue-600"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AnimatedCounter value={viewStats.totalViews} duration={1.5} />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="card-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  লাইভ ভিজিটর
                </CardTitle>
                <Activity className="h-5 w-5 text-green-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-green-600"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AnimatedCounter value={viewStats.liveViews} duration={0.8} />
                </motion.div>
                {viewStats.liveViews > 0 && (
                  <motion.div 
                    className="text-xs text-green-600 mt-1"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ● লাইভ আপডেট
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="card-shadow border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ইউনিক ভিজিটর
                </CardTitle>
                <Users className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-orange-600"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AnimatedCounter value={viewStats.uniqueVisitors} duration={1.2} />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নাম বা ফোন দিয়ে সার্চ করুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>ব্যালেন্স</TableHead>
                  <TableHead>কয়েন</TableHead>
                  <TableHead>অর্ডার</TableHead>
                  <TableHead>মোট খরচ</TableHead>
                  <TableHead>যোগদান</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/20 hover:bg-accent/30 transition-all duration-200 last:border-b-0"
                    >
                      <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                      <TableCell>{u.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          ৳{u.balance}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {u.coins} 🪙
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{u.total_orders || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-mono">
                          ৳{u.total_spent?.toFixed(2) || "0.00"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("bn-BD")}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditUser(u);
                                setEditBalance(String(u.balance));
                                setEditCoins(String(u.coins));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>ইউজার এডিট - {u.display_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-foreground">ব্যালেন্স (৳)</label>
                                <Input value={editBalance} onChange={(e) => setEditBalance(e.target.value)} type="number" />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-foreground">কয়েন</label>
                                <Input value={editCoins} onChange={(e) => setEditCoins(e.target.value)} type="number" />
                              </div>
                              <Button onClick={handleUpdateUser} className="w-full">আপডেট করুন</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      কোনো ইউজার পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsersEnhanced;
