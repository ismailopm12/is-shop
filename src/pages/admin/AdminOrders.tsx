import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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

  const fetchAll = async () => {
    // Product orders
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
                  {orders.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">কোনো অর্ডার নেই</TableCell></TableRow>}
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
    </AdminLayout>
  );
};

export default AdminOrders;
