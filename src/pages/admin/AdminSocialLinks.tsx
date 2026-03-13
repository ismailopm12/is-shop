import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Link, Send, MessageCircle, Facebook, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SocialLink {
  id: string;
  platform: string;
  display_name: string;
  url: string;
  icon: string;
  button_color: string;
  sort_order: number;
  is_active: boolean;
}

const AdminSocialLinks = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [form, setForm] = useState({
    platform: "",
    display_name: "",
    url: "",
    icon: "link",
    button_color: "primary",
    sort_order: "0",
    is_active: true
  });

  const fetchSocialLinks = async () => {
    const { data } = await supabase
      .from("social_links" as any)
      .select("*")
      .order("sort_order");
    if (data) setSocialLinks(data as unknown as SocialLink[]);
  };

  useEffect(() => { fetchSocialLinks(); }, []);

  const resetForm = () => {
    setForm({
      platform: "",
      display_name: "",
      url: "",
      icon: "link",
      button_color: "primary",
      sort_order: "0",
      is_active: true
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (s: SocialLink) => {
    setEditing(s);
    setForm({
      platform: s.platform,
      display_name: s.display_name,
      url: s.url,
      icon: s.icon,
      button_color: s.button_color,
      sort_order: s.sort_order.toString(),
      is_active: s.is_active
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.platform.trim() || !form.display_name.trim() || !form.url.trim()) {
      toast.error("সব তথ্য পূরণ করুন");
      return;
    }

    const dataToSave = {
      ...form,
      sort_order: parseInt(form.sort_order)
    };

    if (editing) {
      const { error } = await supabase
        .from("social_links" as any)
        .update(dataToSave)
        .eq("id", editing.id);
      if (error) { toast.error("আপডেট ব্যর্থ"); return; }
      toast.success("সোশ্যাল লিংক আপডেট হয়েছে");
    } else {
      const { error } = await supabase
        .from("social_links" as any)
        .insert(dataToSave);
      if (error) { 
        if (error.code === '23505') { // Unique violation
          toast.error("এই প্ল্যাটফর্ম ইতিমধ্যে আছে!"); 
        } else {
          toast.error("যোগ করতে ব্যর্থ"); 
        }
        return; 
      }
      toast.success("সোশ্যাল লিংক যোগ হয়েছে");
    }
    setOpen(false);
    resetForm();
    fetchSocialLinks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই সোশ্যাল লিংক ডিলিট করতে চান?")) return;
    const { error } = await supabase.from("social_links" as any).delete().eq("id", id);
    if (error) { toast.error("ডিলিট ব্যর্থ"); return; }
    toast.success("ডিলিট হয়েছে");
    fetchSocialLinks();
  };

  const getIconComponent = (iconName: string) => {
    switch(iconName?.toLowerCase()) {
      case 'send': return Send;
      case 'message-circle': return MessageCircle;
      case 'facebook': return Facebook;
      default: return Globe;
    }
  };

  const getColorBadge = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      primary: 'bg-primary'
    };
    return colors[color] || 'bg-primary';
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link className="h-6 w-6" />
            সোশ্যাল বাটন ম্যানেজমেন্ট
          </h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            নতুন বাটন যোগ করুন
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>অর্ডার</TableHead>
                  <TableHead>প্ল্যাটফর্ম</TableHead>
                  <TableHead>বাটন টেক্সট</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>রঙ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {socialLinks.map(link => {
                  const IconComponent = getIconComponent(link.icon);
                  return (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="capitalize">{link.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{link.display_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs font-mono">
                        {link.url}
                      </TableCell>
                      <TableCell>
                        <Badge className={getColorBadge(link.button_color)}>
                          {link.button_color}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {link.is_active ? (
                          <span className="text-green-600 font-semibold">✅ Active</span>
                        ) : (
                          <span className="text-red-600 font-semibold">❌ Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(link)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(link.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {socialLinks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      কোনো সোশ্যাল লিংক নেই
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "এডিট" : "নতুন"} সোশ্যাল বাটন
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                প্ল্যাটফর্ম * (telegram, whatsapp, facebook)
              </label>
              <Input 
                placeholder="telegram" 
                value={form.platform} 
                onChange={(e) => setForm({ ...form, platform: e.target.value.toLowerCase() })} 
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                উদাহরণ: telegram, whatsapp, facebook
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                বাটন টেক্সট *
              </label>
              <Input 
                placeholder="Join us on Telegram" 
                value={form.display_name} 
                onChange={(e) => setForm({ ...form, display_name: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                URL *
              </label>
              <Input 
                placeholder="https://t.me/yourchannel" 
                value={form.url} 
                onChange={(e) => setForm({ ...form, url: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  আইকন
                </label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                >
                  <option value="send">Send (Telegram)</option>
                  <option value="message-circle">Message Circle (WhatsApp)</option>
                  <option value="facebook">Facebook</option>
                  <option value="globe">Globe (Generic)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  বাটন রঙ
                </label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.button_color}
                  onChange={(e) => setForm({ ...form, button_color: e.target.value })}
                >
                  <option value="blue">নীল (Telegram)</option>
                  <option value="green">সবুজ (WhatsApp)</option>
                  <option value="primary">প্রাইমারি (Default)</option>
                </select>
              </div>
            </div>
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
            <div className="flex items-center gap-2">
              <Switch 
                checked={form.is_active} 
                onCheckedChange={(v) => setForm({ ...form, is_active: v })} 
              />
              <label className="text-sm font-medium">সক্রিয়</label>
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

export default AdminSocialLinks;
