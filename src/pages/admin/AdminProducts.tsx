import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  image_url: string | null;
  category: string;
  description: string | null;
  is_active: boolean;
  is_voucher: boolean;
  created_at: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("FREE FIRE");
  const [description, setDescription] = useState("");
  const [isVoucher, setIsVoucher] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data as Product[]);
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setName(""); setSlug(""); setImageUrl(""); setCategory("FREE FIRE"); setDescription(""); setIsVoucher(false);
  };

  const handleAdd = async () => {
    if (!name || !slug) { toast.error("নাম ও স্লাগ দিন"); return; }
    const { error } = await supabase.from("products").insert({
      name, slug, image_url: imageUrl || null, category, description, is_voucher: isVoucher
    });
    if (error) { toast.error("যোগ করা যায়নি: " + error.message); return; }
    toast.success("প্রোডাক্ট যোগ হয়েছে");
    resetForm(); setShowAdd(false);
    fetchProducts();
  };

  const handleEdit = async () => {
    if (!editProduct) return;
    const { error } = await supabase.from("products").update({
      name, slug, image_url: imageUrl || null, category, description, is_voucher: isVoucher
    }).eq("id", editProduct.id);
    if (error) { toast.error("আপডেট ব্যর্থ: " + error.message); return; }
    toast.success("প্রোডাক্ট আপডেট হয়েছে");
    setEditProduct(null); resetForm();
    fetchProducts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("ডিলিট ব্যর্থ"); return; }
    toast.success("ডিলিট হয়েছে");
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setName(p.name); setSlug(p.slug); setImageUrl(p.image_url || "");
    setCategory(p.category); setDescription(p.description || ""); setIsVoucher(p.is_voucher);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">প্রোডাক্ট ম্যানেজমেন্ট</h2>
          <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />নতুন প্রোডাক্ট</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>নতুন প্রোডাক্ট যোগ করুন</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="প্রোডাক্টের নাম" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="স্লাগ (URL)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">প্রোডাক্ট ইমেজ</label>
                  <ImageUpload folder="products" currentUrl={imageUrl} onUpload={setImageUrl} />
                  <Input placeholder="অথবা ইমেজ URL দিন" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-2" />
                </div>
                <Input placeholder="ক্যাটাগরি" value={category} onChange={(e) => setCategory(e.target.value)} />
                <Textarea placeholder="প্রোডাক্ট ডেসক্রিপশন" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">ভাউচার প্রোডাক্ট</label>
                  <Switch checked={isVoucher} onCheckedChange={setIsVoucher} />
                </div>
                <Button onClick={handleAdd} className="w-full">যোগ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={!!editProduct} onOpenChange={(o) => { if (!o) { setEditProduct(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>প্রোডাক্ট এডিট করুন</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="প্রোডাক্টের নাম" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="স্লাগ (URL)" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">প্রোডাক্ট ইমেজ</label>
                <ImageUpload folder="products" currentUrl={imageUrl} onUpload={setImageUrl} />
                <Input placeholder="অথবা ইমেজ URL দিন" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-2" />
              </div>
              <Input placeholder="ক্যাটাগরি" value={category} onChange={(e) => setCategory(e.target.value)} />
              <Textarea placeholder="প্রোডাক্ট ডেসক্রিপশন" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">ভাউচার প্রোডাক্ট</label>
                <Switch checked={isVoucher} onCheckedChange={setIsVoucher} />
              </div>
              <Button onClick={handleEdit} className="w-full">আপডেট করুন</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইমেজ</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>স্লাগ</TableHead>
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.slug}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      কোনো প্রোডাক্ট নেই
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

export default AdminProducts;
