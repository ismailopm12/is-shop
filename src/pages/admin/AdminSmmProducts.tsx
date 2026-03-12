import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

interface SmmProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  price: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  sort_order: number;
}

const AdminSmmProducts = () => {
  const [products, setProducts] = useState<SmmProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SmmProduct | null>(null);
  const [form, setForm] = useState({ name: "", category: "SMM", description: "", image_url: "", price: 0, min_quantity: 1, max_quantity: 10000, is_active: true, sort_order: 0 });

  const fetchProducts = async () => {
    const { data } = await supabase.from("smm_products").select("*").order("sort_order");
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", category: "SMM", description: "", image_url: "", price: 0, min_quantity: 1, max_quantity: 10000, is_active: true, sort_order: 0 });
    setOpen(true);
  };

  const openEdit = (p: SmmProduct) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, description: p.description || "", image_url: p.image_url || "", price: p.price, min_quantity: p.min_quantity, max_quantity: p.max_quantity, is_active: p.is_active, sort_order: p.sort_order });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("নাম দিন"); return; }
    if (editing) {
      const { error } = await supabase.from("smm_products").update(form).eq("id", editing.id);
      if (error) { toast.error("আপডেট ব্যর্থ"); return; }
      toast.success("আপডেট হয়েছে");
    } else {
      const { error } = await supabase.from("smm_products").insert(form);
      if (error) { toast.error("যোগ করতে ব্যর্থ"); return; }
      toast.success("যোগ হয়েছে");
    }
    setOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ডিলিট করতে চান?")) return;
    await supabase.from("smm_products").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে");
    fetchProducts();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">SMM প্রোডাক্ট</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />নতুন যোগ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{editing ? "এডিট" : "নতুন"} SMM প্রোডাক্ট</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="নাম" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="ক্যাটাগরি" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                <Textarea placeholder="বিবরণ" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="ছবি URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium">মূল্য</label>
                    <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Min Qty</label>
                    <Input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Max Qty</label>
                    <Input type="number" value={form.max_quantity} onChange={e => setForm({ ...form, max_quantity: Number(e.target.value) })} />
                  </div>
                </div>
                <Input type="number" placeholder="Sort Order" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  <span className="text-sm">সক্রিয়</span>
                </div>
                <Button onClick={handleSave} className="w-full">সেভ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead>মূল্য</TableHead>
                  <TableHead>Min/Max</TableHead>
                  <TableHead>সক্রিয়</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>৳{p.price}</TableCell>
                    <TableCell>{p.min_quantity}/{p.max_quantity}</TableCell>
                    <TableCell>{p.is_active ? "✅" : "❌"}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Edit className="h-3 w-3" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">কোনো SMM প্রোডাক্ট নেই</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSmmProducts;
