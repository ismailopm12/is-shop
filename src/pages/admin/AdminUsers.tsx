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
import { Search, Edit, Ban } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  balance: number;
  coins: number;
  created_at: string;
}

interface CoinPurchase {
  user_id: string;
  display_name: string | null;
  total_spent: number;
  purchase_count: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editCoins, setEditCoins] = useState("");
  const [coinPurchases, setCoinPurchases] = useState<CoinPurchase[]>([]);
  const [showCoinTab, setShowCoinTab] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchCoinPurchases = async () => {
    // Query orders where payment was made with coins (we'll track this via payment_records)
    const { data: purchases } = await supabase
      .from("payment_records")
      .select(`
        user_id,
        amount,
        profiles:user_id(display_name)
      `)
      .eq("status", "completed")
      .eq("type", "product");

    if (purchases) {
      const aggregated = purchases.reduce((acc, curr) => {
        const displayName = (curr.profiles as any)?.display_name || "ব্যবহারকারী";
        if (!acc[curr.user_id]) {
          acc[curr.user_id] = {
            user_id: curr.user_id,
            display_name: displayName,
            total_spent: 0,
            purchase_count: 0,
          };
        }
        acc[curr.user_id].total_spent += curr.amount || 0;
        acc[curr.user_id].purchase_count += 1;
        return acc;
      }, {} as Record<string, CoinPurchase>);

      setCoinPurchases(Object.values(aggregated).sort((a, b) => b.total_spent - a.total_spent));
    }
  };

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

    if (error) { toast.error("আপডেট ব্যর্থ হয়েছে"); return; }
    toast.success("ইউজার আপডেট হয়েছে");
    setEditUser(null);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-foreground">ইউজার ম্যানেজমেন্ট</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={!showCoinTab ? "default" : "outline"}
              onClick={() => setShowCoinTab(false)}
            >
              সব ইউজার
            </Button>
            <Button
              size="sm"
              variant={showCoinTab ? "default" : "outline"}
              onClick={() => {
                setShowCoinTab(true);
                fetchCoinPurchases();
              }}
            >
              🪙 কয়েন দিয়ে ক্রয়
            </Button>
          </div>
          <Badge variant="secondary">{showCoinTab ? coinPurchases.length : users.length} জন</Badge>
        </div>

        {!showCoinTab ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="নাম বা ফোন দিয়ে সার্চ করুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>ব্যালেন্স</TableHead>
                  <TableHead>কয়েন</TableHead>
                  <TableHead>যোগদান</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                    <TableCell>{u.phone || "—"}</TableCell>
                    <TableCell>৳{u.balance}</TableCell>
                    <TableCell>{u.coins}</TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString("bn-BD")}</TableCell>
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
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      কোনো ইউজার পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>🪙 কয়েন দিয়ে পণ্য ক্রয় করেছেন এমন ব্যবহারকারীগণ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ব্যবহারকারী</TableHead>
                    <TableHead>মোট ক্রয় (৳)</TableHead>
                    <TableHead>ক্রয় সংখ্যা</TableHead>
                    <TableHead>গড় ক্রয়</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coinPurchases.map((p) => (
                    <TableRow key={p.user_id}>
                      <TableCell className="font-medium">{p.display_name || "ব্যবহারকারী"}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">৳{p.total_spent}</Badge>
                      </TableCell>
                      <TableCell>{p.purchase_count}</TableCell>
                      <TableCell>৳{(p.total_spent / p.purchase_count).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {coinPurchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        কেউ কয়েন দিয়ে ক্রয় করেনি
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
