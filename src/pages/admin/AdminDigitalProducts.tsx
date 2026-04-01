import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, FileIcon } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface DigitalProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  file_url: string | null;
  file_type: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminDigitalProducts = () => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<DigitalProduct | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("THEMES");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("zip");
  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("digital_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProducts(data as DigitalProduct[]);
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setName(""); setDescription(""); setCategory("THEMES"); setPrice("");
    setImageUrl(""); setFileUrl(""); setFileType("zip");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'zip';
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("digital-files").upload(path, file);
    if (error) { toast.error("ফাইল আপলোড ব্যর্থ: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("digital-files").getPublicUrl(path);
    setFileUrl(path);
    setFileType(ext);
    toast.success("ফাইল আপলোড হয়েছে");
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!name || !price) { toast.error("নাম ও মূল্য দিন"); return; }
    const { error } = await supabase.from("digital_products").insert({
      name, description, category, price: Number(price),
      image_url: imageUrl || null, file_url: fileUrl || null, file_type: fileType,
    });
    if (error) { toast.error("যোগ করা যায়নি: " + error.message); return; }
    toast.success("ডিজিটাল প্রোডাক্ট যোগ হয়েছে");
    resetForm(); setShowAdd(false); fetchProducts();
  };

  const handleEdit = async () => {
    if (!editProduct) return;
    const { error } = await supabase.from("digital_products").update({
      name, description, category, price: Number(price),
      image_url: imageUrl || null, file_url: fileUrl || null, file_type: fileType,
    }).eq("id", editProduct.id);
    if (error) { toast.error("আপডেট ব্যর্থ: " + error.message); return; }
    toast.success("আপডেট হয়েছে");
    setEditProduct(null); resetForm(); fetchProducts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("digital_products").update({ is_active: !current }).eq("id", id);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("digital_products").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে"); fetchProducts();
  };

  const openEdit = (p: DigitalProduct) => {
    setEditProduct(p); setName(p.name); setDescription(p.description || "");
    setCategory(p.category); setPrice(String(p.price));
    setImageUrl(p.image_url || ""); setFileUrl(p.file_url || ""); setFileType(p.file_type || "zip");
  };
  
  useEffect(() => { fetchProducts(); }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">ডিজিটাল প্রোডাক্ট</h2>
          <Dialog open={showAdd} onOpenChange={o => { setShowAdd(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />নতুন ফাইল প্রোডাক্ট</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>নতুন ডিজিটাল প্রোডাক্ট</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <Input placeholder="প্রোডাক্টের নাম" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="ক্যাটাগরি (THEMES, PLUGINS, FILES)" value={category} onChange={e => setCategory(e.target.value)} />
                <Input placeholder="মূল্য (৳)" type="number" value={price} onChange={e => setPrice(e.target.value)} />
                <Textarea placeholder="বিবরণ" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                <div>
                  <label className="text-sm font-medium block mb-1">প্রিভিউ ইমেজ</label>
                  <ImageUpload folder="digital-products" currentUrl={imageUrl} onUpload={setImageUrl} />
                  <Input placeholder="অথবা ইমেজ URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">ডিজিটাল ফাইল (zip/pdf/image)</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm">
                      <Upload className="h-4 w-4" />
                      {uploading ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}
                      <input type="file" className="hidden" onChange={handleFileUpload} accept=".zip,.pdf,.png,.jpg,.jpeg,.webp,.rar,.7z" />
                    </label>
                    {fileUrl && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{fileUrl}</span>}
                  </div>
                </div>
                <Input placeholder="ফাইল টাইপ (zip/pdf/image)" value={fileType} onChange={e => setFileType(e.target.value)} />
                <Button onClick={handleAdd} className="w-full">যোগ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={!!editProduct} onOpenChange={o => { if (!o) { setEditProduct(null); resetForm(); } }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>এডিট করুন</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="প্রোডাক্টের নাম" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="ক্যাটাগরি (THEMES, PLUGINS, FILES)" value={category} onChange={e => setCategory(e.target.value)} />
              <Input placeholder="মূল্য (৳)" type="number" value={price} onChange={e => setPrice(e.target.value)} />
              <Textarea placeholder="বিবরণ" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <div>
                <label className="text-sm font-medium block mb-1">প্রিভিউ ইমেজ</label>
                <ImageUpload folder="digital-products" currentUrl={imageUrl} onUpload={setImageUrl} />
                <Input placeholder="অথবা ইমেজ URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">ডিজিটাল ফাইল (zip/pdf/image)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm">
                    <Upload className="h-4 w-4" />
                    {uploading ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".zip,.pdf,.png,.jpg,.jpeg,.webp,.rar,.7z" />
                  </label>
                  {fileUrl && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{fileUrl}</span>}
                </div>
              </div>
              <Input placeholder="ফাইল টাইপ (zip/pdf/image)" value={fileType} onChange={e => setFileType(e.target.value)} />
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
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead>মূল্য</TableHead>
                  <TableHead>ফাইল</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? <img src={p.image_url} className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><FileIcon className="h-5 w-5 text-muted-foreground" /></div>}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell>৳{p.price}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.file_type?.toUpperCase() || "—"}</TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} /></TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">কোনো ডিজিটাল প্রোডাক্ট নেই</TableCell>
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

export default AdminDigitalProducts;
