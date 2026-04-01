import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, Package, TrendingUp, User } from "lucide-react";

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

const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string; border: string }> = {
  completed: { icon: CheckCircle, label: "সম্পন্ন", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  processing: { icon: Package, label: "প্রসেসিং", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  pending: { icon: Clock, label: "পেন্ডিং", color: "text-orange-400", bg: "bg-orange-50", border: "border-orange-200" },
};

const maskName = (name: string) => {
  // Show full name now (no masking)
  return name || "ব্যবহারকারী";
};

const LiveOrderTicker = () => {
  const [orders, setOrders] = useState<OrderTick[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      console.log("=== Fetching LIVE orders (latest first)...");
      
      // Fetch all recent orders (not just today), limited to 10 most recent
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("id, product_name, package_info, status, amount, created_at, user_id")
        .order("created_at", { ascending: false }) // Newest first
        .limit(10);

      if (error) {
        console.error("❌ Error fetching live orders:", error);
        return;
      }

      if (!orderData || orderData.length === 0) {
        console.log("No orders found at all");
        setOrders([]);
        return;
      }

      console.log(`✅ Found ${orderData.length} live orders`);

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
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  if (orders.length === 0) {
    return (
      <section className="mt-4 mb-6">
        <div className="max-w-4xl mx-auto px-3">
          <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-900 border border-green-200 dark:border-green-800 p-4 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-sm font-bold text-foreground mb-1">এখনও কোনো অর্ডার আসেনি</h3>
            <p className="text-xs text-muted-foreground">নতুন অর্ডার আসলে এখানে লাইভ দেখা যাবে</p>
          </div>
        </div>
      </section>
    );
  }

  const config = (status: string) => statusConfig[status] || statusConfig.pending;

  return (
    <section className="mt-4 mb-6">
      <div className="max-w-4xl mx-auto px-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-green-500 to-green-600"></span>
            </span>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-xs font-extrabold">
              🟢 লাইভ ({orders.length})
            </span>
          </h3>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
            <TrendingUp className="h-3 w-3 animate-pulse" />
            <span className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">লাইভ</span>
          </div>
        </div>

        {/* Desktop Table - Compact Design */}
        <div className="hidden lg:block rounded-lg bg-white dark:bg-gray-900 shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left py-2 px-3 font-semibold text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">⏰ সময়</th>
                  <th className="text-left py-2 px-3 font-semibold text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">👤 ক্রেতা</th>
                  <th className="text-left py-2 px-3 font-semibold text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">📦 প্রোডাক্ট</th>
                  <th className="text-left py-2 px-3 font-semibold text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">🎁 প্যাকেজ</th>
                  <th className="text-center py-2 px-3 font-semibold text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">✅ স্ট্যাটাস</th>
                  <th className="text-right py-2 px-3 font-semibold text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">💰 মূল্য</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order, index) => {
                  const cfg = config(order.status);
                  const Icon = cfg.icon;
                  return (
                    <tr 
                      key={order.id} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 last:border-b-0"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="py-2 px-3 text-[10px] text-gray-500 whitespace-nowrap font-mono">
                        {new Date(order.created_at).toLocaleTimeString("bn-BD", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {order.avatar_url ? (
                            <img
                              src={order.avatar_url.replace(/=s\d+-c/, "=s32-c")}
                              alt={order.display_name || 'User'}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                              {order.display_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-foreground whitespace-nowrap">
                              {maskName(order.display_name)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-xs font-medium text-foreground whitespace-nowrap">
                          {order.product_name}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-[10px] text-gray-500 max-w-[120px] truncate">
                          {order.package_info}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}` }>
                          <Icon className="h-3 w-3" />
                          <span className="text-[10px] font-bold">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            ৳{order.amount}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards - Compact Design */}
        <div className="lg:hidden space-y-2">
          {orders.slice(0, 10).map((order, index) => {
            const cfg = config(order.status);
            const Icon = cfg.icon;
            return (
              <div 
                key={order.id}
                className="rounded-lg bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-lg transition-shadow duration-200"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Header with Time and Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {new Date(order.created_at).toLocaleTimeString("bn-BD", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    <Icon className="h-2.5 w-2.5" />
                    <span className="text-[10px] font-bold">{cfg.label}</span>
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  {order.avatar_url ? (
                    <img
                      src={order.avatar_url.replace(/=s\d+-c/, "=s32-c")}
                      alt={order.display_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                      {order.display_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {maskName(order.display_name)}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {order.product_name}
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">🎁 প্যাকেজ</div>
                    <div className="text-xs font-medium text-foreground truncate">
                      {order.package_info}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 mb-0.5">💰 মূল্য</div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">
                        ৳{order.amount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiveOrderTicker;
