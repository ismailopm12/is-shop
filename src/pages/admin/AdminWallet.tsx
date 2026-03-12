import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Wallet, Plus, Minus, TrendingUp, DollarSign, Users, CheckCircle, XCircle } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  balance: number;
  coins: number;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  type: string;
  amount: number | null;
  status: string | null;
  created_at: string | null;
  invoice_id: string | null;
}

const AdminWallet = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("balance", { ascending: false });
    if (data) setUsers(data);
  };

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payment_records")
      .select("*")
      .eq("type", "add_money")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setPayments(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchPayments();
  }, []);

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
  const totalDeposits = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingDeposits = payments.filter(p => p.status === "pending").length;

  const filteredUsers = users.filter(u =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search) ||
    u.user_id.includes(search)
  );

  const filteredPayments = filterStatus === "all"
    ? payments
    : payments.filter(p => p.status === filterStatus);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.display_name || userId.slice(0, 8) + "...";
  };

  const handleWalletAction = async () => {
    if (!selectedUser || !amount || Number(amount) <= 0) {
      toast.error("সঠিক পরিমাণ দিন");
      return;
    }

    setProcessing(true);
    const amountNum = Number(amount);
    const newBalance = actionType === "add"
      ? selectedUser.balance + amountNum
      : selectedUser.balance - amountNum;

    if (newBalance < 0) {
      toast.error("ব্যালেন্স নেগেটিভ হতে পারে না");
      setProcessing(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("আপডেট ব্যর্থ হয়েছে");
      setProcessing(false);
      return;
    }

    toast.success(
      actionType === "add"
        ? `৳${amountNum} যোগ করা হয়েছে ${selectedUser.display_name || "ইউজার"} এর ওয়ালেটে`
        : `৳${amountNum} কেটে নেওয়া হয়েছে ${selectedUser.display_name || "ইউজার"} এর ওয়ালেট থেকে`
    );

    setDialogOpen(false);
    setAmount("");
    setSelectedUser(null);
    setProcessing(false);
    fetchUsers();
  };

  const handleApproveDeposit = async (payment: PaymentRecord) => {
    if (payment.status !== "pending") return;
    setProcessing(true);

    // Find user profile
    const userProfile = users.find(u => u.user_id === payment.user_id);
    if (!userProfile) {
      toast.error("ইউজার খুঁজে পাওয়া যায়নি");
      setProcessing(false);
      return;
    }

    // Add balance to user
    const newBalance = userProfile.balance + (payment.amount || 0);
    const { error: balanceErr } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", payment.user_id);

    if (balanceErr) {
      toast.error("ব্যালেন্স আপডেট ব্যর্থ");
      setProcessing(false);
      return;
    }

    // Update payment status
    const { error: payErr } = await supabase
      .from("payment_records")
      .update({ status: "completed" })
      .eq("id", payment.id);

    if (payErr) {
      toast.error("স্ট্যাটাস আপডেট ব্যর্থ");
      setProcessing(false);
      return;
    }

    toast.success(`৳${payment.amount} অ্যাপ্রুভ করা হয়েছে — ${getUserName(payment.user_id)}`);
    setProcessing(false);
    fetchUsers();
    fetchPayments();
  };

  const handleRejectDeposit = async (payment: PaymentRecord) => {
    if (payment.status !== "pending") return;
    setProcessing(true);

    const { error } = await supabase
      .from("payment_records")
      .update({ status: "rejected" })
      .eq("id", payment.id);

    if (error) {
      toast.error("রিজেক্ট করতে ব্যর্থ");
      setProcessing(false);
      return;
    }

    toast.success(`ডিপোজিট রিজেক্ট করা হয়েছে`);
    setProcessing(false);
    fetchPayments();
  };

  const openAction = (user: UserProfile, type: "add" | "deduct") => {
    setSelectedUser(user);
    setActionType(type);
    setAmount("");
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-foreground">ওয়ালেট ম্যানেজমেন্ট</h2>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">মোট ব্যালেন্স</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">৳{totalBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">মোট ডিপোজিট</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">৳{totalDeposits.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">পেন্ডিং ডিপোজিট</CardTitle>
              <Wallet className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{pendingDeposits} টি</div>
            </CardContent>
          </Card>
        </div>

        {/* User Wallets */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> ইউজার ওয়ালেট
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="নাম, ফোন বা ID দিয়ে সার্চ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>ব্যালেন্স</TableHead>
                  <TableHead>কয়েন</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                    <TableCell>{u.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.balance > 0 ? "default" : "secondary"}>
                        ৳{u.balance.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.coins}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openAction(u, "add")}
                          className="text-green-600 border-green-200 hover:bg-green-50">
                          <Plus className="h-3 w-3 mr-1" /> যোগ
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAction(u, "deduct")}
                          className="text-red-600 border-red-200 hover:bg-red-50">
                          <Minus className="h-3 w-3 mr-1" /> কাটা
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      কোনো ইউজার পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Deposit History with Approve/Reject */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> ডিপোজিট রিকোয়েস্ট
              </CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব</SelectItem>
                  <SelectItem value="pending">পেন্ডিং</SelectItem>
                  <SelectItem value="completed">অ্যাপ্রুভড</SelectItem>
                  <SelectItem value="rejected">রিজেক্টেড</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইউজার</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{getUserName(p.user_id)}</TableCell>
                    <TableCell className="font-semibold">৳{p.amount || 0}</TableCell>
                    <TableCell>
                      <Badge variant={
                        p.status === "completed" ? "default" :
                        p.status === "pending" ? "secondary" : "destructive"
                      }>
                        {p.status === "completed" ? "অ্যাপ্রুভড" :
                         p.status === "pending" ? "পেন্ডিং" :
                         p.status === "rejected" ? "রিজেক্টেড" : p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.invoice_id || "—"}</TableCell>
                    <TableCell>{p.created_at ? new Date(p.created_at).toLocaleDateString("bn-BD") : "—"}</TableCell>
                    <TableCell>
                      {p.status === "pending" ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processing}
                            onClick={() => handleApproveDeposit(p)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> অ্যাপ্রুভ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processing}
                            onClick={() => handleRejectDeposit(p)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3 mr-1" /> রিজেক্ট
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      কোনো ডিপোজিট পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Deduct Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType === "add" ? (
                  <><Plus className="h-5 w-5 text-green-600" /> ব্যালেন্স যোগ করুন</>
                ) : (
                  <><Minus className="h-5 w-5 text-red-600" /> ব্যালেন্স কাটুন</>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">ইউজার</p>
                <p className="font-semibold text-foreground">{selectedUser?.display_name || "—"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  বর্তমান ব্যালেন্স: <span className="text-primary font-bold">৳{selectedUser?.balance.toFixed(2)}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">পরিমাণ (৳)</label>
                <Input
                  type="number"
                  placeholder="পরিমাণ লিখুন"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {amount && Number(amount) > 0 && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  নতুন ব্যালেন্স হবে: <span className="font-bold text-primary">
                    ৳{(actionType === "add"
                      ? (selectedUser?.balance || 0) + Number(amount)
                      : (selectedUser?.balance || 0) - Number(amount)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              <Button
                onClick={handleWalletAction}
                disabled={processing}
                className="w-full"
                variant={actionType === "add" ? "default" : "destructive"}
              >
                {processing ? "প্রসেসিং..." : actionType === "add" ? "যোগ করুন" : "কেটে নিন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWallet;
