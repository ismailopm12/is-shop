import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, Image as ImageIcon } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface Developer {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  facebook_url: string | null;
  whatsapp_url: string | null;
  telegram_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const AdminDevelopers = () => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Developer | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "Developer",
    image_url: "",
    bio: "",
    email: "",
    phone: "",
    facebook_url: "",
    whatsapp_url: "",
    telegram_url: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    sort_order: "0",
    is_active: true
  });

  const fetchDevelopers = async () => {
    const { data } = await supabase
      .from("developers")
      .select("*")
      .order("sort_order");
    if (data) setDevelopers(data as Developer[]);
  };

  useEffect(() => { fetchDevelopers(); }, []);

  const resetForm = () => {
    setForm({
      name: "",
      role: "Developer",
      image_url: "",
      bio: "",
      email: "",
      phone: "",
      facebook_url: "",
      whatsapp_url: "",
      telegram_url: "",
      github_url: "",
      linkedin_url: "",
      twitter_url: "",
      sort_order: "0",
      is_active: true
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (d: Developer) => {
    setEditing(d);
    setForm({
      name: d.name,
      role: d.role,
      image_url: d.image_url || "",
      bio: d.bio || "",
      email: d.email || "",
      phone: d.phone || "",
      facebook_url: d.facebook_url || "",
      whatsapp_url: d.whatsapp_url || "",
      telegram_url: d.telegram_url || "",
      github_url: d.github_url || "",
      linkedin_url: d.linkedin_url || "",
      twitter_url: d.twitter_url || "",
      sort_order: d.sort_order.toString(),
      is_active: d.is_active
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("নাম দিন");
      return;
    }

    const dataToSave = {
      ...form,
      sort_order: parseInt(form.sort_order)
    };

    if (editing) {
      const { error } = await supabase
        .from("developers")
        .update(dataToSave)
        .eq("id", editing.id);
      if (error) { toast.error("আপডেট ব্যর্থ"); return; }
      toast.success("ডেভেলপার আপডেট হয়েছে");
    } else {
      const { error } = await supabase
        .from("developers")
        .insert(dataToSave);
      if (error) { toast.error("যোগ করতে ব্যর্থ"); return; }
      toast.success("ডেভেলপার যোগ হয়েছে");
    }
    setOpen(false);
    resetForm();
    fetchDevelopers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই ডেভেলপার ডিলিট করতে চান?")) return;
    await supabase.from("developers").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে");
    fetchDevelopers();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            ডেভেলপার ম্যানেজমেন্ট
          </h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            নতুন ডেভেলপার যোগ করুন
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ছবি</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>রোল</TableHead>
                  <TableHead>ইমেইল</TableHead>
                  <TableHead>সোর্ট অর্ডার</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {d.image_url ? (
                        <img src={d.image_url} alt={d.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.role}</TableCell>
                    <TableCell>{d.email || "—"}</TableCell>
                    <TableCell>{d.sort_order}</TableCell>
                    <TableCell>
                      {d.is_active ? (
                        <span className="text-green-600 font-semibold">✅ Active</span>
                      ) : (
                        <span className="text-red-600 font-semibold">❌ Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {developers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      কোনো ডেভেলপার নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { resetForm(); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "এডিট" : "নতুন"} ডেভেলপার
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  নাম *
                </label>
                <Input 
                  placeholder="Ismail" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  রোল
                </label>
                <Input 
                  placeholder="Lead Developer" 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })} 
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                ছবি
              </label>
              <ImageUpload 
                folder="developers" 
                currentUrl={form.image_url} 
                onUpload={(url) => setForm({ ...form, image_url: url })} 
              />
              <Input 
                placeholder="অথবা ছবি URL দিন" 
                value={form.image_url} 
                onChange={(e) => setForm({ ...form, image_url: e.target.value })} 
                className="mt-2"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                বিবরণ
              </label>
              <Textarea 
                placeholder="ডেভেলপার সম্পর্কে বিস্তারিত তথ্য..." 
                value={form.bio} 
                onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                rows={3}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  ইমেইল
                </label>
                <Input 
                  type="email"
                  placeholder="ismail@example.com" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  ফোন
                </label>
                <Input 
                  type="tel"
                  placeholder="+880..." 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">সোশ্যাল মিডিয়া লিংক</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  placeholder="Facebook URL" 
                  value={form.facebook_url} 
                  onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} 
                />
                <Input 
                  placeholder="WhatsApp URL" 
                  value={form.whatsapp_url} 
                  onChange={(e) => setForm({ ...form, whatsapp_url: e.target.value })} 
                />
                <Input 
                  placeholder="Telegram URL" 
                  value={form.telegram_url} 
                  onChange={(e) => setForm({ ...form, telegram_url: e.target.value })} 
                />
                <Input 
                  placeholder="GitHub URL" 
                  value={form.github_url} 
                  onChange={(e) => setForm({ ...form, github_url: e.target.value })} 
                />
                <Input 
                  placeholder="LinkedIn URL" 
                  value={form.linkedin_url} 
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} 
                />
                <Input 
                  placeholder="Twitter URL" 
                  value={form.twitter_url} 
                  onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} 
                />
              </div>
            </div>

            {/* Sort Order & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  সোর্ট অর্ডার
                </label>
                <Input 
                  type="number"
                  value={form.sort_order} 
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })} 
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch 
                  checked={form.is_active} 
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })} 
                />
                <label className="text-sm font-medium">সক্রিয়</label>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {editing ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDevelopers;
