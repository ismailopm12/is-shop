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
import { Plus, Edit, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .order("sort_order");
    if (data) setCategories(data as Category[]);
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setName(""); setSlug(""); setDescription(""); setIcon("📦");
    setSortOrder("0"); setIsActive(true);
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleAdd = async () => {
    if (!name || !slug) { toast.error("নাম ও স্লাগ দিন"); return; }
    
    const { error } = await supabase.from("product_categories").insert({
      name, slug, description, icon, sort_order: parseInt(sortOrder), is_active: isActive,
    });
    
    if (error) { toast.error("যোগ করা যায়নি: " + error.message); return; }
    toast.success("ক্যাটাগরি যোগ হয়েছে");
    resetForm(); setShowAdd(false); fetchCategories();
  };

  const handleEdit = async () => {
    if (!editCategory) return;
    
    const { error } = await supabase.from("product_categories").update({
      name, slug, description, icon, sort_order: parseInt(sortOrder), is_active: isActive,
    }).eq("id", editCategory.id);
    
    if (error) { toast.error("আপডেট ব্যর্থ: " + error.message); return; }
    toast.success("আপডেট হয়েছে");
    setEditCategory(null); resetForm(); fetchCategories();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("product_categories").update({ is_active: !current }).eq("id", id);
    toast.success(current ? "ডিসএবল হয়েছে" : "এনাবল হয়েছে");
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    
    // Check if category has products
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .eq("category_id", id)
      .limit(1);
    
    if (products && products.length > 0) {
      toast.error("এই ক্যাটাগরিতে প্রোডাক্ট আছে। আগে প্রোডাক্ট সরান।");
      return;
    }
    
    const { error } = await supabase.from("product_categories").delete().eq("id", id);
    if (error) { toast.error("ডিলিট ব্যর্থ"); return; }
    toast.success("ডিলিট হয়েছে");
    fetchCategories();
  };

  const openEdit = (c: Category) => {
    setEditCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || "");
    setIcon(c.icon || "📦");
    setSortOrder(String(c.sort_order));
    setIsActive(c.is_active);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-foreground">ক্যাটাগরি ম্যানেজমেন্ট</h2>
          <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />নতুন ক্যাটাগরি</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>নতুন ক্যাটাগরি তৈরি করুন</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="ক্যাটাগরির নাম" value={name} onChange={e => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }} />
                <Input placeholder="স্লাগ (URL)" value={slug} onChange={e => setSlug(e.target.value)} />
                <Textarea placeholder="বিবরণ" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                <Input placeholder="আইকন (ইমোজি)" value={icon} onChange={e => setIcon(e.target.value)} />
                <Input type="number" placeholder="সর্ট অর্ডার" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">সক্রিয়</label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <Button onClick={handleAdd} className="w-full">যোগ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={!!editCategory} onOpenChange={(o) => { if (!o) { setEditCategory(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>ক্যাটাগরি এডিট করুন</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="ক্যাটাগরির নাম" value={name} onChange={e => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }} />
              <Input placeholder="স্লাগ (URL)" value={slug} onChange={e => setSlug(e.target.value)} />
              <Textarea placeholder="বিবরণ" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <Input placeholder="আইকন (ইমোজি)" value={icon} onChange={e => setIcon(e.target.value)} />
              <Input type="number" placeholder="সর্ট অর্ডার" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">সক্রিয়</label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
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
                  <TableHead>আইকন</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>স্লাগ</TableHead>
                  <TableHead>সর্ট</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-2xl">{c.icon || "📦"}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                    <TableCell>{c.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(c.id, c.is_active)}>
                          {c.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      কোনো ক্যাটাগরি নেই
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

export default AdminCategories;
