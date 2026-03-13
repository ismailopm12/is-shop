import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye } from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  product_name: string;
  player_id: string | null;
  package_info: string;
  amount: number;
  status: string;
  created_at: string;
  voucher_code_id: string | null;
  package_id: string | null;
  user_info?: any; // Dynamic user info fields
}

interface DigitalPurchase {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
  digital_products: { name: string } | null;
}

interface SmmOrder {
  id: string;
  user_id: string;
  product_name: string;
  quantity: number;
  target_link: string;
  amount: number;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [digitalPurchases, setDigitalPurchases] = useState<DigitalPurchase[]>([]);
  const [smmOrders, setSmmOrders] = useState<SmmOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchAll = async () => {
    // Product orders - include user_info
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    const { data: od } = await q;
    if (od) setOrders(od);

    // Digital purchases
    const { data: dp } = await supabase.from("digital_purchases").select("id, user_id, amount, created_at, digital_products(name)").order("created_at", { ascending: false });
    if (dp) setDigitalPurchases(dp as any);

    // SMM orders
    let sq = supabase.from("smm_orders").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") sq = sq.eq("status", filterStatus);
    const { data: so } = await sq;
    if (so) setSmmOrders(so);
  };

  useEffect(() => { fetchAll(); }, [filterStatus]);

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (newStatus === "completed" && !order.voucher_code_id) {
      const { data: products } = await supabase.from("products").select("id, is_voucher").eq("name", order.product_name).limit(1);
      if (products && products.length > 0 && products[0].is_voucher) {
        const { data: voucherCode } = await supabase.rpc("assign_voucher_to_order", {
          _order_id: order.id, _product_id: products[0].id, _user_id: order.user_id, _package_id: order.package_id || null,
        });
        if (voucherCode) toast.success(`ভাউচার অ্যাসাইন্ড: ${voucherCode}`);
        else toast.warning("স্টকে ভাউচার নেই!");
      }
    }

    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("আপডেট ব্যর্থ"); return; }
    toast.success("স্ট্যাটাস আপডেট হয়েছে");
    fetchAll();
  };

  const updateSmmStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("smm_orders").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("আপডেট ব্যর্থ"); return; }
    toast.success("SMM স্ট্যাটাস আপডেট হয়েছে");
    fetchAll();
  };

  const StatusFilter = () => (
    <Select value={filterStatus} onValueChange={setFilterStatus}>
      <SelectTrigger className="w-[180px]"><SelectValue placeholder="ফিল্টার" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">সব</SelectItem>
        <SelectItem value="pending">পেন্ডিং</SelectItem>
        <SelectItem value="processing">প্রসেসিং</SelectItem>
        <SelectItem value="completed">সম্পন্ন</SelectItem>
        <SelectItem value="cancelled">বাতিল</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-foreground">অর্ডার ম্যানেজমেন্ট</h2>
          <StatusFilter />
        </div>

        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">প্রোডাক্ট ({orders.length})</TabsTrigger>
            <TabsTrigger value="digital">ডিজিটাল ({digitalPurchases.length})</TabsTrigger>
            <TabsTrigger value="smm">SMM ({smmOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead>ব্যবহারকারারী তথ্য</TableHead>
                    <TableHead>প্লেয়ার</TableHead>
                    <TableHead>প্যাকেজ</TableHead>
                    <TableHead>মূল্য</TableHead>
                    <TableHead>ভাউচার</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                      <TableCell>{o.product_name}</TableCell>
                      <TableCell>
                        {o.user_info && Object.keys(o.user_info).length > 0 ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs"
                            onClick={() => viewOrderDetails(o)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            দেখুন
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>{o.player_id || "—"}</TableCell>
                      <TableCell>{o.package_info}</TableCell>
                      <TableCell>৳{o.amount}</TableCell>
                      <TableCell>{o.voucher_code_id ? <Badge className="bg-green-100 text-green-800">অ্যাসাইন্ড</Badge> : "—"}</TableCell>
                      <TableCell><Badge className={statusColors[o.status] || ""}>{o.status}</Badge></TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString("bn-BD")}</TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={v => updateOrderStatus(o.id, v)}>
                          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">পেন্ডিং</SelectItem>
                            <SelectItem value="processing">প্রসেসিং</SelectItem>
                            <SelectItem value="completed">সম্পন্ন</SelectItem>
                            <SelectItem value="cancelled">বাতিল</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">কোনো অর্ডার নেই</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="digital">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead>মূল্য</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {digitalPurchases.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}</TableCell>
                      <TableCell>{(d.digital_products as any)?.name || "—"}</TableCell>
                      <TableCell>৳{d.amount}</TableCell>
                      <TableCell>{new Date(d.created_at).toLocaleDateString("bn-BD")}</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-800">সম্পন্ন</Badge></TableCell>
                    </TableRow>
                  ))}
                  {digitalPurchases.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">কোনো ডিজিটাল অর্ডার নেই</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="smm">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead>পরিমাণ</TableHead>
                    <TableHead>লিংক</TableHead>
                    <TableHead>মূল্য</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smmOrders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                      <TableCell>{o.product_name}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs">{o.target_link}</TableCell>
                      <TableCell>৳{o.amount}</TableCell>
                      <TableCell><Badge className={statusColors[o.status] || ""}>{o.status}</Badge></TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString("bn-BD")}</TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={v => updateSmmStatus(o.id, v)}>
                          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">পেন্ডিং</SelectItem>
                            <SelectItem value="processing">প্রসেসিং</SelectItem>
                            <SelectItem value="completed">সম্পন্ন</SelectItem>
                            <SelectItem value="cancelled">বাতিল</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {smmOrders.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">কোনো SMM অর্ডার নেই</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog - Shows all user info */}
      <Dialog open={showDetailsDialog} onOpenChange={(o) => { setShowDetailsDialog(o); if (!o) setSelectedOrder(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              অর্ডার বিস্তারিত - {selectedOrder?.product_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Basic Order Info */}
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="text-sm font-bold mb-3">অর্ডার তথ্য</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">অর্ডার ID:</span>
                    <div className="font-mono text-xs mt-1">{selectedOrder.id}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">প্রোডাক্ট:</span>
                    <div className="font-medium mt-1">{selectedOrder.product_name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">প্লেয়ার ID:</span>
                    <div className="mt-1">{selectedOrder.player_id || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">প্যাকেজ:</span>
                    <div className="mt-1">{selectedOrder.package_info}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">মূল্য:</span>
                    <div className="font-medium mt-1">৳{selectedOrder.amount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">স্ট্যাটাস:</span>
                    <Badge className={statusColors[selectedOrder.status] || ""}>{selectedOrder.status}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">তারিখ:</span>
                    <div className="mt-1">{new Date(selectedOrder.created_at).toLocaleString("bn-BD")}</div>
                  </div>
                  {selectedOrder.voucher_code_id && (
                    <div>
                      <span className="text-muted-foreground">ভাউচার কোড:</span>
                      <div className="font-mono text-xs mt-1">{selectedOrder.voucher_code_id}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic User Info Fields */}
              {selectedOrder.user_info && Object.keys(selectedOrder.user_info).length > 0 && (
                <div className="p-4 border rounded-lg bg-card">
                  <h3 className="text-sm font-bold mb-3">ব্যবহারকারীর তথ্য</h3>
                  <div className="space-y-3">
                    {Object.entries(selectedOrder.user_info).map(([key, value]) => {
                      // Format label from key (e.g., "game_uid" → "Game UID")
                      const formattedLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      
                      return (
                        <div key={key} className="flex items-start justify-between p-2 bg-background rounded">
                          <span className="text-sm font-medium text-muted-foreground">{formattedLabel}</span>
                          <span className="text-sm font-semibold">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User Profile Link */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.location.href = `/admin/users`}
                >
                  ইউজার প্রোফাইল দেখুন
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedOrder.user_info, null, 2));
                    toast.success("তথ্য কপি হয়েছে");
                  }}
                >
                  তথ্য কপি করুন
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
