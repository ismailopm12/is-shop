import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, Package } from "lucide-react";

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

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  completed: { icon: CheckCircle, label: "সম্পন্ন", color: "text-green-500" },
  processing: { icon: Package, label: "প্রসেসিং", color: "text-blue-500" },
  pending: { icon: Clock, label: "পেন্ডিং", color: "text-yellow-500" },
};

const maskName = (name: string) => {
  if (!name || name.length <= 2) return name || "ইউজার";
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
        display_name: profileMap.get(o.user_id)?.display_name || "ইউজার",
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
    <section className="mt-3 mb-0">
      <div className="max-w-4xl mx-auto px-2">
        <h3 className="text-[11px] font-bold text-foreground mb-1.5 flex items-center gap-1">
          <span className="relative flex h-1 w-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1 w-1 bg-green-500"></span>
          </span>
          লাইভ অর্ডার
        </h3>
        <div className="rounded-lg bg-card shadow-md overflow-hidden border border-border/30">
          {/* Responsive Table - Compact Spacing */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-1.5 px-1.5 font-semibold text-[9px] uppercase tracking-tight text-muted-foreground whitespace-nowrap">সময়</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-[9px] uppercase tracking-tight text-muted-foreground whitespace-nowrap">ব্যবহারকারী</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-[9px] uppercase tracking-tight text-muted-foreground whitespace-nowrap hidden sm:table-cell">প্রোডাক্ট</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-[9px] uppercase tracking-tight text-muted-foreground whitespace-nowrap hidden md:table-cell">প্যাকেজ</th>
                  <th className="text-center py-1.5 px-1.5 font-semibold text-[9px] uppercase tracking-tight text-muted-foreground whitespace-nowrap">স্ট্যাটাস</th>
                  <th className="text-right py-1.5 px-1.5 font-semibold text-[9px] uppercase tracking-tight text-muted-foreground whitespace-nowrap">মূল্য</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order, index) => {
                  const cfg = config(order.status);
                  const Icon = cfg.icon;
                  return (
                    <tr 
                      key={order.id} 
                      className="border-b border-border/20 hover:bg-accent/20 transition-all duration-150"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="py-1.5 px-1.5 text-[9px] text-muted-foreground whitespace-nowrap font-mono align-middle">
                        {new Date(order.created_at).toLocaleTimeString("bn-BD", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-1.5 px-1.5 align-middle">
                        <div className="flex items-center gap-1">
                          {order.avatar_url ? (
                            <img
                              src={order.avatar_url.replace(/=s\d+-c/, "=s32-c")}
                              alt={order.display_name || 'User'}
                              className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[7px] font-bold text-primary-foreground flex-shrink-0">
                              {order.display_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-[9px] font-semibold text-foreground truncate max-w-[70px] sm:max-w-[90px]">
                            {maskName(order.display_name)}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5 whitespace-nowrap hidden sm:table-cell align-middle">
                        <div className="font-medium text-[9px] text-foreground truncate max-w-[100px]">
                          {order.product_name}
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5 whitespace-nowrap hidden md:table-cell align-middle">
                        <div className="text-[8px] text-muted-foreground truncate max-w-[80px]">
                          {order.package_info}
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5 align-middle">
                        <div className="flex items-center justify-center gap-0.5">
                          <Icon className={`h-2.5 w-2.5 ${cfg.color}`} />
                          <span className={`text-[8px] font-bold ${cfg.color} whitespace-nowrap`}>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5 text-right whitespace-nowrap align-middle">
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded-sm">
                          ৳{order.amount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-3">
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
