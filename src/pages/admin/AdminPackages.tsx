import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
}

interface Package {
  id: string;
  product_id: string;
  name: string;
  value: string;
  price: number;
  sort_order: number;
  is_active: boolean;
  reward_coins?: number;
  diamonds?: number;
}

const AdminPackages = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [addProductId, setAddProductId] = useState("");
  const [addName, setAddName] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addSort, setAddSort] = useState("0");
  const [addRewardCoins, setAddRewardCoins] = useState("0");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name").order("name");
    if (data) setProducts(data);
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // First try product_variants (new system)
      let query = supabase.from("product_variants").select("*").order("sort_order");
      if (selectedProduct !== "all") query = query.eq("product_id", selectedProduct);
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching variants:", error.message);
        // Fallback to diamond_packages (old system)
        let fallbackQuery = supabase.from("diamond_packages").select("*").order("sort_order");
        if (selectedProduct !== "all") fallbackQuery = fallbackQuery.eq("product_id", selectedProduct);
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) {
          console.error("Fallback error:", fallbackError.message);
          toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
          setPackages([]);
          setLoading(false);
          return;
        }
        
        if (fallbackData) {
          const converted = fallbackData.map(pkg => ({
            ...pkg,
            name: (pkg as any).name || "",
            value: `${pkg.diamonds}`,
            reward_coins: (pkg as any).reward_coins || 0,
          } as Package));
          setPackages(converted);
        } else {
          setPackages([]);
        }
        setLoading(false);
        return;
      }
      
      if (data) {
        // Use product_variants data directly
        setPackages(data as Package[]);
      } else {
        setPackages([]);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
      setPackages([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { fetchPackages(); }, [selectedProduct]);

  const handleAdd = async () => {
    if (!addProductId || !addValue || !addPrice) { toast.error("সব ফিল্ড পূরণ করুন"); return; }
    
    try {
      // Insert into product_variants (primary table)
      const { error: variantError } = await supabase.from("product_variants").insert({
        product_id: addProductId,
        name: addName || null, // Custom name or null
        value: `${addValue}`, // Store value as string
        price: parseFloat(addPrice),
        sort_order: parseInt(addSort),
        reward_coins: parseInt(addRewardCoins) || 0,
        is_active: true,
      });
      
      if (variantError) {
        console.error("Variant error:", variantError);
        // Fallback to diamond_packages for backwards compatibility
        const { error } = await supabase.from("diamond_packages").insert({
          product_id: addProductId,
          diamonds: parseInt(addValue),
          price: parseFloat(addPrice),
          sort_order: parseInt(addSort),
          name: addName || null,
        });
        if (error) { toast.error("যোগ করা যায়নি"); return; }
      }
      
      toast.success("প্যাকেজ যোগ হয়েছে");
      setShowAdd(false); setAddValue(""); setAddPrice(""); setAddSort("0"); setAddRewardCoins("0"); setAddName("");
      fetchPackages();
    } catch (err: any) {
      console.error("Add error:", err);
      toast.error("প্যাকেজ যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleUpdateRewardCoins = async (packageId: string, currentReward: number) => {
    const newReward = prompt(`কয়েন রিওয়ার্ড দিন (বর্তমান: ${currentReward}):`, currentReward.toString());
    if (newReward === null) return; // User cancelled
    
    const rewardAmount = parseInt(newReward);
    if (isNaN(rewardAmount)) {
      toast.error("সঠিক কয়েন সংখ্যা দিন");
      return;
    }

    try {
      // First try updating product_variants (new system)
      const { error: variantError } = await supabase
        .from('product_variants')
        .update({ reward_coins: rewardAmount })
        .eq('id', packageId);

      if (variantError) {
        console.error("Variant update error:", variantError.message);
        toast.error("আপডেট করতে সমস্যা হয়েছে");
        return;
      }

      toast.success("রিওয়ার্ড আপডেট হয়েছে");
      fetchPackages();
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error("আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    
    // Try deleting from product_variants first (new system)
    const { error: variantError } = await supabase.from("product_variants").delete().eq("id", id);
    
    // If that fails, try diamond_packages (old system)
    if (variantError) {
      await supabase.from("diamond_packages").delete().eq("id", id);
    }
    
    toast.success("ডিলিট হয়েছে");
    fetchPackages();
  };

  const openEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setAddProductId(pkg.product_id);
    setAddName(pkg.name || "");
    setAddValue(pkg.value);
    setAddPrice(pkg.price.toString());
    setAddSort(pkg.sort_order.toString());
    setAddRewardCoins((pkg.reward_coins || 0).toString());
  };

  const handleEdit = async () => {
    if (!editingPackage) return;
    if (!addProductId || !addValue || !addPrice) { toast.error("সব ফিল্ড পূরণ করুন"); return; }
    
    try {
      // Update in product_variants (primary table)
      const { error: variantError } = await supabase.from("product_variants").update({
        product_id: addProductId,
        name: addName || null,
        value: `${addValue}`,
        price: parseFloat(addPrice),
        sort_order: parseInt(addSort),
        reward_coins: parseInt(addRewardCoins) || 0,
      }).eq("id", editingPackage.id);
      
      if (variantError) {
        console.error("Variant update error:", variantError);
        toast.error("আপডেট করতে সমস্যা হয়েছে");
        return;
      }
      
      toast.success("প্যাকেজ আপডেট হয়েছে");
      setEditingPackage(null);
      setAddValue(""); setAddPrice(""); setAddSort("0"); setAddRewardCoins("0"); setAddName("");
      fetchPackages();
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error("আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || "—";

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-foreground">প্যাকেজ ম্যানেজমেন্ট</h2>
          <div className="flex gap-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="প্রোডাক্ট ফিল্টার" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব প্রোডাক্ট</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />নতুন প্যাকেজ</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>নতুন প্যাকেজ তৈরি করুন</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Select value={addProductId} onValueChange={setAddProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="প্রোডাক্ট সিলেক্ট করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    type="text" 
                    placeholder="প্যাকেজের নাম (ঐচ্ছিক)" 
                    value={addName} 
                    onChange={e => setAddName(e.target.value)} 
                  />
                  <Input type="number" placeholder="ভ্যালু/পরিমাণ" value={addValue} onChange={e => setAddValue(e.target.value)} />
                  <Input type="number" placeholder="মূল্য (TK)" value={addPrice} onChange={e => setAddPrice(e.target.value)} />
                  <Input type="number" placeholder="সর্ট অর্ডার" value={addSort} onChange={e => setAddSort(e.target.value)} />
                  <Input 
                    type="number" 
                    placeholder="রিওয়ার্ড কয়েন (ঐচ্ছিক)" 
                    value={addRewardCoins} 
                    onChange={e => setAddRewardCoins(e.target.value)} 
                  />
                  <Button onClick={handleAdd} className="w-full">যোগ করুন</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Package Dialog */}
        <Dialog open={!!editingPackage} onOpenChange={(o) => { if (!o) { setEditingPackage(null); setAddValue(""); setAddPrice(""); setAddSort("0"); setAddRewardCoins("0"); setAddName(""); } }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>প্যাকেজ এডিট করুন</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <Select value={addProductId} onValueChange={setAddProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="প্রোডাক্ট সিলেক্ট করুন" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <Input 
                  type="text" 
                  placeholder="প্যাকেজের নাম (ঐচ্ছিক)" 
                  value={addName} 
                  onChange={e => setAddName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Input type="number" placeholder="ভ্যালু/পরিমাণ" value={addValue} onChange={e => setAddValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input type="number" placeholder="মূল্য (TK)" value={addPrice} onChange={e => setAddPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input type="number" placeholder="সর্ট অর্ডার" value={addSort} onChange={e => setAddSort(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input 
                  type="number" 
                  placeholder="রিওয়ার্ড কয়েন (ঐচ্ছিক)" 
                  value={addRewardCoins} 
                  onChange={e => setAddRewardCoins(e.target.value)} 
                />
              </div>
              <Button onClick={handleEdit} className="w-full">আপডেট করুন</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>প্রোডাক্ট</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>ভ্যালু</TableHead>
                  <TableHead>মূল্য (TK)</TableHead>
                  <TableHead>রিওয়ার্ড কয়েন</TableHead>
                  <TableHead>সর্ট</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map(pkg => (
                  <TableRow key={pkg.id}>
                    <TableCell>{getProductName(pkg.product_id)}</TableCell>
                    <TableCell className="font-medium">{pkg.name || "—"}</TableCell>
                    <TableCell>{pkg.value}</TableCell>
                    <TableCell>৳{pkg.price}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-1 h-7 text-xs"
                        onClick={() => handleUpdateRewardCoins(pkg.id, pkg.reward_coins || 0)}
                      >
                        🪙 {pkg.reward_coins || 0}
                        <span className="text-[9px] text-muted-foreground">(এডিট)</span>
                      </Button>
                    </TableCell>
                    <TableCell>{pkg.sort_order}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(pkg)}>
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(pkg.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {packages.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      কোনো প্যাকেজ নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPackages;
