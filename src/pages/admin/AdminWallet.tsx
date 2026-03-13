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
import { Search, Wallet, Plus, Minus, TrendingUp, DollarSign, Users, CheckCircle, XCircle, Video, Upload, Trash2, Edit } from "lucide-react";

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

interface PaymentVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_mb: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const AdminWallet = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [videos, setVideos] = useState<PaymentVideo[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<PaymentVideo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Video form state
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoActive, setVideoActive] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("payment_method_videos")
      .select("*")
      .order("sort_order");
    if (data) setVideos(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchPayments();
    fetchVideos();
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

  // Video Management Functions
  const handleUploadVideo = async () => {
    if (!videoTitle || !videoUrl) {
      toast.error("শিরোনাম এবং ভিডিও লিংক প্রয়োজন");
      return;
    }

    setUploading(true);
    try {
      const videoData = {
        title: videoTitle,
        description: videoDescription,
        video_url: videoUrl,
        is_active: videoActive,
        sort_order: videos.length + 1,
      };

      let error;
      if (editingVideo) {
        // Update existing video
        ({ error } = await supabase
          .from("payment_method_videos")
          .update(videoData)
          .eq("id", editingVideo.id));
      } else {
        // Create new video
        ({ error } = await supabase
          .from("payment_method_videos")
          .insert([videoData]));
      }

      if (error) throw error;

      toast.success(editingVideo ? "ভিডিও আপডেট হয়েছে" : "নতুন ভিডিও যোগ হয়েছে");
      resetVideoForm();
      fetchVideos();
    } catch (err: any) {
      toast.error(err.message || "ভিডিও সেভ করতে ব্যর্থ");
    } finally {
      setUploading(false);
    }
  };

  const handleEditVideo = (video: PaymentVideo) => {
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoDescription(video.description || "");
    setVideoUrl(video.video_url);
    setVideoActive(video.is_active);
    setVideoDialogOpen(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("এই ভিডিওটি মুছে ফেলতে চান?")) return;

    const { error } = await supabase
      .from("payment_method_videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      toast.error("মুছে ফেলতে ব্যর্থ");
      return;
    }

    toast.success("ভিডিও মুছে ফেলা হয়েছে");
    fetchVideos();
  };

  const resetVideoForm = () => {
    setVideoTitle("");
    setVideoDescription("");
    setVideoUrl("");
    setVideoActive(true);
    setEditingVideo(null);
    setVideoDialogOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("ফাইলের সাইজ ৫০ MB এর বেশি হতে পারবে না");
      return;
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error("শুধুমাত্র ভিডিও ফাইল আপলোড করা যাবে");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-videos')
        .getPublicUrl(fileName);

      setVideoUrl(publicUrl);
      toast.success("ভিডিও আপলোড সম্পন্ন হয়েছে");
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
    }
  };

  const openAction = (user: UserProfile, type: "add" | "deduct") => {
    setSelectedUser(user);
    setActionType(type);
    setAmount("");
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 w-full">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">ওয়ালেট ম্যানেজমেন্ট</h2>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
          <Card className="card-shadow border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">মোট ব্যালেন্স</CardTitle>
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </CardHeader>
            <CardContent className="px-3 md:px-4 pt-0 md:pt-2">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">৳{totalBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="card-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">মোট ডিপোজিট</CardTitle>
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </CardHeader>
            <CardContent className="px-3 md:px-4 pt-0 md:pt-2">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">৳{totalDeposits.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="card-shadow border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">পেন্ডিং ডিপোজিট</CardTitle>
              <Wallet className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
            </CardHeader>
            <CardContent className="px-3 md:px-4 pt-0 md:pt-2">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">{pendingDeposits} টি</div>
            </CardContent>
          </Card>
        </div>

        {/* User Wallets */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-4 md:py-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl">
                <Users className="h-5 w-5 md:h-6 md:w-6" /> ইউজার ওয়ালেট
              </CardTitle>
              <div className="relative w-full sm:w-64 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  placeholder="নাম, ফোন বা ID দিয়ে সার্চ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 md:h-11 min-h-[44px] text-sm md:text-base w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 w-full">
            <div className="overflow-x-auto -mx-1 md:-mx-6">
              <div className="min-w-[800px] px-4 md:px-6 pb-4">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Videos */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" /> পেমেন্ট মেথড ভিডিও
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => {
                  resetVideoForm();
                  setVideoDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> নতুন ভিডিও যোগ করুন
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিরোনাম</TableHead>
                  <TableHead>বিবরণ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>ক্রম</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        {v.title}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {v.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.is_active ? "default" : "secondary"}>
                        {v.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                    </TableCell>
                    <TableCell>{v.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditVideo(v)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteVideo(v.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {videos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      কোনো ভিডিও নেই। উপরে "নতুন ভিডিও যোগ করুন" এ ক্লিক করুন।
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

        {/* Video Upload/Edit Dialog */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                {editingVideo ? "ভিডিও এডিট করুন" : "নতুন ভিডিও যোগ করুন"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  শিরোনাম <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="যেমন: বিকাশে টাকা জমা দেওয়ার নিয়ম"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">বিবরণ</label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ভিডিও সম্পর্কে বিস্তারিত লিখুন..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  ভিডিও লিংক <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="https://example.com/video.mp4 অথবা নিচে আপলোড করুন"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/50">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      ভিডিও ফাইল আপলোড করুন
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      সর্বোচ্চ ৫০ MB (MP4, WebM, AVI)
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          {uploading ? "আপলোড হচ্ছে..." : "ফাইল সিলেক্ট করুন"}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {videoUrl && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 font-medium">
                        ✓ ভিডিও লিংক সেট হয়েছে
                      </p>
                      <a 
                        href={videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 block truncate"
                      >
                        {videoUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="video-active"
                  checked={videoActive}
                  onChange={(e) => setVideoActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="video-active" className="text-sm font-medium">
                  ভিডিওটি সক্রিয় রাখুন
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={resetVideoForm}
                  className="flex-1"
                >
                  বাতিল করুন
                </Button>
                <Button
                  onClick={handleUploadVideo}
                  disabled={uploading || !videoTitle || !videoUrl}
                  className="flex-1"
                >
                  {uploading ? "সেভ হচ্ছে..." : editingVideo ? "আপডেট করুন" : "যোগ করুন"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWallet;
