import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  is_voucher: boolean;
}

interface Package {
  id: string;
  product_id: string;
  name?: string;
  value: string;
  price: number;
  diamonds?: number; // For backward compatibility with diamond_packages
}

interface VoucherCode {
  id: string;
  product_id: string;
  package_id: string | null;
  code: string;
  user_id: string | null;
  status: string;
  assigned_at: string | null;
  created_at: string;
}

const AdminVoucherCodes = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherCode | null>(null);
  const [editCodeValue, setEditCodeValue] = useState("");
  const [addProductId, setAddProductId] = useState("");
  const [addPackageId, setAddPackageId] = useState("");
  const [bulkCodes, setBulkCodes] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, is_voucher").eq("is_voucher", true).order("name");
    if (data) setProducts(data);
  };

  const fetchPackages = async () => {
    try {
      // First try product_variants (new system)
      const { data: variants, error: variantError } = await supabase
        .from("product_variants")
        .select("id, product_id, name, value, price")
        .eq("is_active", true)
        .order("sort_order");
      
      if (variantError) {
        console.error("Error fetching variants:", variantError.message);
      }
      
      // Also fetch diamond_packages for backward compatibility
      const { data: pkgs, error: pkgError } = await supabase
        .from("diamond_packages")
        .select("id, product_id, diamonds, price, name")
        .eq("is_active", true)
        .order("sort_order");
      
      if (pkgError) {
        console.error("Error fetching diamond_packages:", pkgError.message);
      }
      
      // Combine both sources
      let allPackages: Package[] = [];
      
      // Add variants from product_variants
      if (variants) {
        allPackages = variants.map(v => ({
          id: v.id,
          product_id: v.product_id,
          name: v.name || undefined,
          value: v.value,
          price: parseFloat(v.price.toString()),
        }));
      }
      
      // Add packages from diamond_packages (only if not already in variants)
      if (pkgs) {
        const variantIds = new Set(allPackages.map(p => p.id));
        pkgs.forEach(pkg => {
          // Only add if this ID doesn't exist in variants (avoid duplicates)
          if (!variantIds.has(pkg.id)) {
            allPackages.push({
              id: pkg.id,
              product_id: pkg.product_id,
              name: (pkg as any).name || undefined,
              value: `${(pkg as any).diamonds || 'N/A'}`,
              price: parseFloat((pkg as any).price.toString()),
              diamonds: (pkg as any).diamonds,
            });
          }
        });
      }
      
      setPackages(allPackages);
    } catch (err: any) {
      console.error("Fetch packages error:", err);
      setPackages([]);
    }
  };

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      console.log("=== Fetching vouchers...");
      console.log("Filters:", { selectedProduct, selectedPackageFilter, filterStatus });
      
      let query = supabase.from("voucher_codes").select("*").order("created_at", { ascending: false });
      if (selectedProduct !== "all") query = query.eq("product_id", selectedProduct);
      if (selectedPackageFilter !== "all") query = query.eq("package_id", selectedPackageFilter);
      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      
      const { data, error } = await query;
      
      if (error) {
        console.error("❌ Error fetching vouchers:", error);
        toast.error(`ভাউচার লোড ব্যর্থ: ${error.message}`);
        setVouchers([]);
        return;
      }
      
      console.log("✅ Fetched vouchers:", data?.length || 0);
      if (data) {
        setVouchers(data as VoucherCode[]);
      } else {
        setVouchers([]);
      }
    } catch (err) {
      console.error("Unexpected error fetching vouchers:", err);
      toast.error("ভাউচার লোড করতে সমস্যা হয়েছে");
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); fetchPackages(); }, []);
  useEffect(() => { fetchVouchers(); }, [selectedProduct, selectedPackageFilter, filterStatus]);

  const addProductPackages = packages.filter(p => p.product_id === addProductId);
  const filterPackages = selectedProduct !== "all" ? packages.filter(p => p.product_id === selectedProduct) : [];

  const handleBulkAdd = async () => {
    if (!addProductId) { toast.error("প্রোডাক্ট সিলেক্ট করুন"); return; }
    if (!addPackageId) { toast.error("ভ্যারিয়েন্ট সিলেক্ট করুন"); return; }
    const codes = bulkCodes.split("\n").map(c => c.trim()).filter(c => c.length > 0);
    if (codes.length === 0) { toast.error("কমপক্ষে একটি কোড দিন"); return; }

    console.log("Adding voucher codes:", {
      product_id: addProductId,
      package_id: addPackageId,
      code_count: codes.length,
      first_code: codes[0]
    });

    const rows = codes.map(code => ({
      product_id: addProductId,
      package_id: addPackageId,
      code,
      status: "available",
    }));

    // First validate that the package/variant exists
    const { data: variantCheck } = await supabase
      .from("product_variants")
      .select("id")
      .eq("id", addPackageId)
      .single();

    if (!variantCheck) {
      // Check diamond_packages as fallback
      const { data: pkgCheck } = await supabase
        .from("diamond_packages")
        .select("id")
        .eq("id", addPackageId)
        .single();
      
      if (!pkgCheck) {
        toast.error("ভ্যারিয়েন্ট পাওয়া যায়নি। দয়া করে আবার চেষ্টা করুন।");
        window.location.reload(); // Refresh to reload variants
        return;
      }
    }

    const { error } = await supabase.from("voucher_codes").insert(rows);
    if (error) {
      console.error("Voucher code insert error:", error);
      
      // Handle FK constraint errors specifically
      if (error.code === '23503') {
        toast.error("ভ্যারিয়েন্ট বৈধ নয়। দয়া করে পেজ রিফ্রেশ করুন।");
        window.location.reload();
      } else {
        toast.error(`যোগ করা যায়নি: ${error.message}`);
      }
      return;
    }
    
    toast.success(`${codes.length}টি ভাউচার কোড যোগ হয়েছে`);
    setBulkCodes(""); setAddPackageId(""); setShowAdd(false);
    fetchVouchers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("voucher_codes").delete().eq("id", id);
    if (error) { toast.error("ডিলিট ব্যর্থ"); return; }
    toast.success("ডিলিট হয়েছে");
    fetchVouchers();
  };

  const openEditVoucher = (voucher: VoucherCode) => {
    setEditingVoucher(voucher);
    setEditCodeValue(voucher.code);
  };

  const handleEditVoucher = async () => {
    if (!editingVoucher) return;
    if (!editCodeValue.trim()) { toast.error("কোড খালি রাখা যাবে না"); return; }

    const { error } = await supabase
      .from("voucher_codes")
      .update({ code: editCodeValue.trim() })
      .eq("id", editingVoucher.id);

    if (error) {
      toast.error(`আপডেট ব্যর্থ: ${error.message}`);
      return;
    }

    toast.success("ভাউচার কোড আপডেট হয়েছে");
    setEditingVoucher(null);
    setEditCodeValue("");
    fetchVouchers();
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || "—";
  const getPackageName = (id: string | null) => {
    if (!id) return "—";
    const pkg = packages.find(p => p.id === id);
    return pkg ? `${pkg.diamonds} - ৳${pkg.price}` : "—";
  };

  const availableCount = vouchers.filter(v => v.status === "available").length;
  const assignedCount = vouchers.filter(v => v.status === "assigned").length;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">ভাউচার কোড</h2>
            <div className="flex gap-3 mt-1">
              <Badge variant="outline" className="text-green-600">স্টক: {availableCount}</Badge>
              <Badge variant="outline" className="text-blue-600">বিক্রিত: {assignedCount}</Badge>
            </div>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />কোড যোগ করুন</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ভাউচার কোড যোগ করুন</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={addProductId} onValueChange={(v) => { setAddProductId(v); setAddPackageId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="প্রোডাক্ট সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addProductId && addProductPackages.length > 0 && (
                  <Select value={addPackageId} onValueChange={setAddPackageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="ভ্যারিয়েন্ট সিলেক্ট করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {addProductPackages.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name || pkg.value} - ৳{pkg.price} {pkg.diamonds ? `(${pkg.diamonds})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {addProductId && addProductPackages.length === 0 && (
                  <p className="text-sm text-destructive">এই প্রোডাক্টে কোনো প্যাকেজ নেই। আগে প্যাকেজ যোগ করুন।</p>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground">কোড (প্রতি লাইনে একটি)</label>
                  <Textarea
                    value={bulkCodes}
                    onChange={e => setBulkCodes(e.target.value)}
                    placeholder={"ABC123-XYZ789\nDEF456-UVW012\nGHI789-RST345"}
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bulkCodes.split("\n").filter(c => c.trim()).length}টি কোড
                  </p>
                </div>
                <Button onClick={handleBulkAdd} className="w-full" disabled={!addPackageId}>যোগ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedPackageFilter("all"); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="প্রোডাক্ট" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব প্রোডাক্ট</SelectItem>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProduct !== "all" && filterPackages.length > 0 && (
            <Select value={selectedPackageFilter} onValueChange={setSelectedPackageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ভ্যারিয়েন্ট" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ভ্যারিয়েন্ট</SelectItem>
                {filterPackages.map(pkg => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name || pkg.value} - ৳{pkg.price} {pkg.diamonds ? `(${pkg.diamonds})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="স্ট্যাটাস" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              <SelectItem value="available">স্টকে আছে</SelectItem>
              <SelectItem value="assigned">বিক্রিত</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>ভাউচার লোড হচ্ছে...</p>
              </div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎫</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">কোনো ভাউচার কোড নেই</h3>
                <p className="text-sm text-muted-foreground mb-4">নতুন ভাউচার কোড যোগ করতে উপরের বাটনে ক্লিক করুন</p>
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4 mr-2" />নতুন কোড যোগ করুন
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead>ভ্যারিয়েন্ট</TableHead>
                    <TableHead>কোড</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map(v => (
                    <TableRow key={v.id}>
                      <TableCell>{getProductName(v.product_id)}</TableCell>
                      <TableCell className="text-xs">{getPackageName(v.package_id)}</TableCell>
                      <TableCell className="font-mono text-xs">{v.code}</TableCell>
                      <TableCell>
                        <Badge className={v.status === "available" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                          {v.status === "available" ? "স্টকে" : "বিক্রিত"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(v.created_at).toLocaleDateString("bn-BD")}</TableCell>
                      <TableCell className="flex gap-1">
                        {v.status === "available" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEditVoucher(v)}>
                              <Plus className="h-4 w-4 rotate-45" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(v.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Voucher Code Dialog */}
        <Dialog open={!!editingVoucher} onOpenChange={(open) => {
          if (!open) {
            setEditingVoucher(null);
            setEditCodeValue("");
          }
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>ভাউচার কোড এডিট করুন</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">প্রোডাক্ট</label>
                <Input 
                  value={getProductName(editingVoucher?.product_id || "")} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">ভ্যারিয়েন্ট</label>
                <Input 
                  value={getPackageName(editingVoucher?.package_id)} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">কোড এডিট করুন</label>
                <Input 
                  value={editCodeValue} 
                  onChange={(e) => setEditCodeValue(e.target.value)}
                  placeholder="ভাউচার কোড"
                />
              </div>
              <Button onClick={handleEditVoucher} className="w-full">আপডেট করুন</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminVoucherCodes;
