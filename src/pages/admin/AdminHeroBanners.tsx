import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface HeroBanner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const AdminHeroBanners = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editBanner, setEditBanner] = useState<HeroBanner | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const fetchBanners = async () => {
    const { data } = await supabase.from("hero_banners").select("*").order("sort_order");
    if (data) setBanners(data as HeroBanner[]);
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetForm = () => { setImageUrl(""); setTitle(""); setLinkUrl(""); setSortOrder("0"); };

  const handleAdd = async () => {
    if (!imageUrl) { toast.error("ইমেজ দিন"); return; }
    const { error } = await supabase.from("hero_banners").insert({
      image_url: imageUrl, title: title || null, link_url: linkUrl || null, sort_order: Number(sortOrder),
    });
    if (error) { toast.error("যোগ করা যায়নি"); return; }
    toast.success("ব্যানার যোগ হয়েছে"); resetForm(); setShowAdd(false); fetchBanners();
  };

  const handleEdit = async () => {
    if (!editBanner) return;
    const { error } = await supabase.from("hero_banners").update({
      image_url: imageUrl, title: title || null, link_url: linkUrl || null, sort_order: Number(sortOrder),
    }).eq("id", editBanner.id);
    if (error) { toast.error("আপডেট ব্যর্থ"); return; }
    toast.success("আপডেট হয়েছে"); setEditBanner(null); resetForm(); fetchBanners();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("hero_banners").update({ is_active: !current }).eq("id", id);
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hero_banners").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে"); fetchBanners();
  };

  const openEdit = (b: HeroBanner) => {
    setEditBanner(b); setImageUrl(b.image_url); setTitle(b.title || "");
    setLinkUrl(b.link_url || ""); setSortOrder(String(b.sort_order));
  };

  const BannerForm = ({ onSubmit, text }: { onSubmit: () => void; text: string }) => (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">ব্যানার ইমেজ *</label>
        <ImageUpload folder="banners" currentUrl={imageUrl} onUpload={setImageUrl} />
        <Input placeholder="অথবা ইমেজ URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="mt-2" />
      </div>
      <Input placeholder="টাইটেল (ঐচ্ছিক)" value={title} onChange={e => setTitle(e.target.value)} />
      <Input placeholder="লিংক URL (ঐচ্ছিক)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
      <Input placeholder="সর্ট অর্ডার" type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
      <Button onClick={onSubmit} className="w-full">{text}</Button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">হিরো ব্যানার</h2>
          <Dialog open={showAdd} onOpenChange={o => { setShowAdd(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />নতুন ব্যানার</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>নতুন হিরো ব্যানার</DialogTitle></DialogHeader>
              <BannerForm onSubmit={handleAdd} text="যোগ করুন" />
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={!!editBanner} onOpenChange={o => { if (!o) { setEditBanner(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>ব্যানার এডিট</DialogTitle></DialogHeader>
            <BannerForm onSubmit={handleEdit} text="আপডেট করুন" />
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইমেজ</TableHead>
                  <TableHead>টাইটেল</TableHead>
                  <TableHead>অর্ডার</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map(b => (
                  <TableRow key={b.id}>
                    <TableCell><img src={b.image_url} className="h-12 w-20 rounded object-cover" /></TableCell>
                    <TableCell>{b.title || "—"}</TableCell>
                    <TableCell>{b.sort_order}</TableCell>
                    <TableCell><Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} /></TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {banners.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">কোনো ব্যানার নেই</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminHeroBanners;
