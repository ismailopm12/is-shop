import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Coins, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  user_id: string;
  email: string;
  display_name: string;
  coins: number;
}

interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
  display_name?: string;
}

interface CoinSetting {
  coin_value: number;
  min_coin_usage: number;
  max_discount_percent: number;
}

const AdminCoins = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [coinSetting, setCoinSetting] = useState<CoinSetting | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [transactionType, setTransactionType] = useState("add");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedUserForTx, setSelectedUserForTx] = useState<string>("all");

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        user_id,
        coins,
        display_name,
        auth_users!inner(email)
      `)
      .order("coins", { ascending: false });
    
    if (data) {
      setUsers(data as any);
    }
    setLoading(false);
  };

  const fetchTransactions = async (userId?: string) => {
    let query = supabase
      .from("coin_transactions")
      .select(`
        id,
        user_id,
        amount,
        transaction_type,
        reference_id,
        description,
        created_at
      `)
      .order("created_at", { ascending: false });
    
    if (userId && userId !== "all") {
      query = query.eq("user_id", userId);
    }
    
    const { data } = await query;
    
    if (data) {
      // Get user display names
      const userIds = [...new Set(data.map(tx => tx.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      
      const enriched = data.map(tx => ({
        ...tx,
        display_name: profileMap.get(tx.user_id) || "Unknown",
      }));
      
      setTransactions(enriched);
    }
  };

  const fetchCoinSettings = async () => {
    const { data } = await supabase
      .from("coin_settings")
      .select("*")
      .single();
    
    if (data) setCoinSetting(data);
  };

  useEffect(() => {
    fetchCoinSettings();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showTransactions) {
      fetchTransactions(selectedUserForTx === "all" ? undefined : selectedUserForTx);
    }
  }, [showTransactions, selectedUserForTx]);

  const handleUpdateSettings = async () => {
    if (!coinSetting) return;
    
    const { error } = await supabase
      .from("coin_settings")
      .update({
        coin_value: parseFloat(coinSetting.coin_value.toString()),
        min_coin_usage: parseInt(coinSetting.min_coin_usage.toString()),
        max_discount_percent: parseInt(coinSetting.max_discount_percent.toString()),
      })
      .eq("id", coinSetting.id);

    if (error) {
      toast.error("সেটিংস আপডেট করতে সমস্যা হয়েছে");
    } else {
      toast.success("সেটিংস আপডেট হয়েছে");
    }
  };

  const handleAddCoins = async () => {
    if (!selectedUserId || !coinAmount) {
      toast.error("সব তথ্য দিন");
      return;
    }

    const amount = parseInt(coinAmount);
    const finalAmount = transactionType === "remove" ? -amount : amount;

    try {
      const { data, error } = await supabase.rpc("add_coins_to_user", {
        _user_id: selectedUserId,
        _amount: finalAmount,
        _transaction_type: "admin_adjustment",
        _description: description || "Admin adjustment",
      });

      if (error) throw error;

      toast.success(`${amount} কয়েন ${transactionType === "add" ? "যোগ" : "বিয়োগ"} হয়েছে`);
      setShowAdd(false);
      setSelectedUserId("");
      setCoinAmount("");
      setDescription("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "সমস্যা হয়েছে");
    }
  };

  const handleEditCoins = async () => {
    if (!editUser || !coinAmount) return;

    const currentCoins = editUser.coins;
    const newCoins = parseInt(coinAmount);
    const difference = newCoins - currentCoins;

    try {
      const { error } = await supabase.rpc("add_coins_to_user", {
        _user_id: editUser.user_id,
        _amount: difference,
        _transaction_type: "admin_adjustment",
        _description: description || "Manual edit by admin",
      });

      if (error) throw error;

      toast.success("কয়েন আপডেট হয়েছে");
      setEditUser(null);
      setCoinAmount("");
      setDescription("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "সমস্যা হয়েছে");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Coin Settings */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">কয়েন সেটিংস</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowTransactions(!showTransactions);
                  if (!showTransactions) fetchTransactions();
                }}
              >
                {showTransactions ? "লুকান" : "সব লেনদেন দেখুন"}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">১ কয়েনের মূল্য (৳)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={coinSetting?.coin_value || ""}
                  onChange={(e) => setCoinSetting(prev => prev ? { ...prev, coin_value: parseFloat(e.target.value) } : null)}
                  placeholder="0.10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">সর্বনিম্ন কয়েন ব্যবহার</label>
                <Input
                  type="number"
                  value={coinSetting?.min_coin_usage || ""}
                  onChange={(e) => setCoinSetting(prev => prev ? { ...prev, min_coin_usage: parseInt(e.target.value) } : null)}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">সর্বোচ্চ ডিসকাউন্ট (%)</label>
                <Input
                  type="number"
                  value={coinSetting?.max_discount_percent || ""}
                  onChange={(e) => setCoinSetting(prev => prev ? { ...prev, max_discount_percent: parseInt(e.target.value) } : null)}
                  placeholder="50"
                />
              </div>
            </div>

            <Button onClick={handleUpdateSettings} className="w-full">
              আপডেট সেটিংস
            </Button>

            {coinSetting && (
              <div className="bg-muted/50 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>
                    বর্তমান রেট: <strong>১ কয়েন = ৳{coinSetting.coin_value}</strong> | 
                    সর্বনিম্ন: <strong>{coinSetting.min_coin_usage} কয়েন</strong> | 
                    সর্বোচ্চ ডিসকাউন্ট: <strong>{coinSetting.max_discount_percent}%</strong>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        {showTransactions && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">সব লেনদেন</h2>
                <Select value={selectedUserForTx} onValueChange={setSelectedUserForTx}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="ব্যবহারকারী ফিল্টার" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব ব্যবহারকারী</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.display_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 font-medium">তারিখ</th>
                      <th className="text-left py-2 font-medium">ব্যবহারকারী</th>
                      <th className="text-left py-2 font-medium">ধরন</th>
                      <th className="text-left py-2 font-medium">পরিমাণ</th>
                      <th className="text-left py-2 font-medium">বিবরণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">
                          কোনো লেনদেন নেই
                        </td>
                      </tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx.id} className="border-b border-border/50">
                          <td className="py-3 text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString("bn-BD")}
                          </td>
                          <td className="py-3 font-medium">{tx.display_name}</td>
                          <td className="py-3">
                            <Badge variant={tx.amount > 0 ? "default" : "secondary"}>
                              {tx.transaction_type === "purchase_reward" && "🎁 রিওয়ার্ড"}
                              {tx.transaction_type === "checkout_used" && "💳 পেমেন্ট"}
                              {tx.transaction_type === "admin_adjustment" && "⚙️ এডমিন"}
                              {tx.transaction_type === "refund" && "↩️ রিফান্ড"}
                            </Badge>
                          </td>
                          <td className={`py-3 font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">
                            {tx.description || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Coin Management */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">ব্যবহারকারীর কয়েন</h2>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />কয়েন যোগ/বিয়োগ</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>কয়েন ম্যানেজমেন্ট</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="ব্যবহারকারী সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.display_name || u.email} ({u.coins} কয়েন)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="অ্যাকশন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">যোগ করুন</SelectItem>
                    <SelectItem value="remove">বিয়োগ করুন</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="কয়েন পরিমাণ"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                />

                <Input
                  placeholder="কারণ/বিবরণ (ঐচ্ছিক)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <Button onClick={handleAddCoins} className="w-full">
                  {transactionType === "add" ? "কয়েন যোগ করুন" : "কয়েন বিয়োগ করুন"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ব্যবহারকারী</TableHead>
                  <TableHead>ইমেইল</TableHead>
                  <TableHead>বর্তমান কয়েন</TableHead>
                  <TableHead>মূল্য (৳)</TableHead>
                  <TableHead>লেনদেন</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.display_name || "—"}</TableCell>
                    <TableCell className="text-sm">{(user as any).auth_users?.email || user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Coins className="h-3 w-3" />
                        {user.coins}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      ৳{(user.coins * (coinSetting?.coin_value || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedUserForTx(user.user_id);
                          setShowTransactions(true);
                          fetchTransactions(user.user_id);
                        }}
                      >
                        দেখুন
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Dialog open={!!editUser && editUser.user_id === user.user_id} onOpenChange={(o) => {
                        if (!o) {
                          setEditUser(null);
                          setCoinAmount("");
                          setDescription("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>এডিট কয়েন</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div className="text-sm">
                              <p>ব্যবহারকারী: <strong>{user.display_name || user.email}</strong></p>
                              <p>বর্তমান কয়েন: <strong>{user.coins}</strong></p>
                              <p>বর্তমান মূল্য: <strong>৳{(user.coins * (coinSetting?.coin_value || 0)).toFixed(2)}</strong></p>
                            </div>
                            
                            <Input
                              type="number"
                              placeholder="নতুন কয়েন পরিমাণ"
                              value={coinAmount}
                              onChange={(e) => setCoinAmount(e.target.value)}
                            />

                            <Input
                              placeholder="কারণ (ঐচ্ছিক)"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />

                            <Button onClick={handleEditCoins} className="w-full">আপডেট করুন</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      কোনো ব্যবহারকারী নেই
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

export default AdminCoins;
