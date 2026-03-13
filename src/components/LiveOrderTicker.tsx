import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, Package, TrendingUp } from "lucide-react";

interface OrderTick {
  id: string;
  product_name: string;
  package_info: string;
  status: string;
  amount: number;
  created_at: string;
  display_name: string;
  avatar_url?: string | null;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; color: string; bg: string; border: string }> = {
  completed: { icon: CheckCircle, label: "সম্পন্ন", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  processing: { icon: Package, label: "প্রসেসিং", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  pending: { icon: Clock, label: "পেন্ডিং", color: "text-orange-400", bg: "bg-orange-50", border: "border-orange-200" },
};

const maskName = (name: string) => {
  if (!name || name.length <= 2) return name || "ব্যবহারকারী";
  // Show first 3 characters, mask the rest
  return name.substring(0, 3) + "...";
};

const LiveOrderTicker = () => {
  const [orders, setOrders] = useState<OrderTick[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      // Fetch recent orders
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, product_name, package_info, status, amount, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!orderData || orderData.length === 0) return;

      // Get unique user IDs
      const userIds = [...new Set(orderData.map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setOrders(orderData.map(o => ({
        id: o.id,
        product_name: o.product_name,
        package_info: o.package_info,
        status: o.status,
        amount: o.amount,
        created_at: o.created_at,
        display_name: profileMap.get(o.user_id)?.display_name || "ব্যবহারকারী",
        avatar_url: profileMap.get(o.user_id)?.avatar_url,
      })));
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (orders.length === 0) return null;

  const config = (status: string) => statusConfig[status] || statusConfig.pending;

  return (
    <section className="mt-4 mb-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Enhanced Header with Orange Animation */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-orange-500 to-orange-600"></span>
            </span>
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent font-extrabold">
              🟠 লাইভ অর্ডার স্ট্যাটাস
            </span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
            <TrendingUp className="h-3.5 w-3.5 animate-pulse" />
            <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">রিয়েল-টাইম আপডেট</span>
          </div>
        </div>

        {/* Enhanced Card with Orange Gradient Border */}
        <div className="rounded-xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden border-2 border-orange-200 dark:border-orange-800 relative">
          {/* Orange Gradient Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
          
          {/* Responsive Table - Orange Theme */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20">
                  <th className="text-left py-3 px-3 font-bold text-[11px] uppercase tracking-wide text-orange-700 dark:text-orange-300 whitespace-nowrap">⏰ সময়</th>
                  <th className="text-left py-3 px-3 font-bold text-[11px] uppercase tracking-wide text-orange-700 dark:text-orange-300 whitespace-nowrap">👤 ব্যবহারকারী</th>
                  <th className="text-left py-3 px-3 font-bold text-[11px] uppercase tracking-wide text-orange-700 dark:text-orange-300 whitespace-nowrap hidden sm:table-cell">📦 প্রোডাক্ট</th>
                  <th className="text-left py-3 px-3 font-bold text-[11px] uppercase tracking-wide text-orange-700 dark:text-orange-300 whitespace-nowrap hidden md:table-cell">🎁 প্যাকেজ</th>
                  <th className="text-center py-3 px-3 font-bold text-[11px] uppercase tracking-wide text-orange-700 dark:text-orange-300 whitespace-nowrap">✅ স্ট্যাটাস</th>
                  <th className="text-right py-3 px-3 font-bold text-[11px] uppercase tracking-wide text-orange-700 dark:text-orange-300 whitespace-nowrap">💰 মূল্য</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order, index) => {
                  const cfg = config(order.status);
                  const Icon = cfg.icon;
                  return (
                    <tr 
                      key={order.id} 
                      className="border-b border-orange-100 dark:border-orange-900/30 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all duration-200 last:border-b-0"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap font-mono align-middle">
                        {new Date(order.created_at).toLocaleTimeString("bn-BD", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 align-middle">
                        <div className="flex items-center gap-2">
                          {order.avatar_url ? (
                            <img
                              src={order.avatar_url.replace(/=s\d+-c/, "=s40-c")}
                              alt={order.display_name || 'User'}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[9px] font-bold text-primary-foreground flex-shrink-0 ring-2 ring-primary/20">
                              {order.display_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-foreground truncate max-w-[80px] sm:max-w-[120px]">
                            {maskName(order.display_name)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap hidden sm:table-cell align-middle">
                        <div className="font-medium text-xs text-foreground truncate max-w-[140px]">
                          {order.product_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap hidden md:table-cell align-middle">
                        <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {order.package_info}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-middle">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border} shadow-sm`}>
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs font-extrabold whitespace-nowrap">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap align-middle">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800">
                          ৳{order.amount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-6">
                      কোনো লাইভ অর্ডার নেই
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveOrderTicker;
