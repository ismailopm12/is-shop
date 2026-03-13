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
import { Plus, Edit, Trash2, Settings } from "lucide-react";

interface APISetting {
  id: string;
  name: string;
  endpoint_url: string;
  region: string;
  description: string | null;
  is_active: boolean;
}

const AdminAPISettings = () => {
  const [settings, setSettings] = useState<APISetting[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<APISetting | null>(null);
  const [form, setForm] = useState({
    name: "",
    endpoint_url: "",
    region: "SG",
    description: "",
    is_active: true
  });

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("api_settings")
      .select("*")
      .order("created_at");
    if (data) setSettings(data as APISetting[]);
  };

  useEffect(() => { fetchSettings(); }, []);

  const resetForm = () => {
    setForm({
      name: "",
      endpoint_url: "",
      region: "SG",
      description: "",
      is_active: true
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (s: APISetting) => {
    setEditing(s);
    setForm({
      name: s.name,
      endpoint_url: s.endpoint_url,
      region: s.region,
      description: s.description || "",
      is_active: s.is_active
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.endpoint_url.trim()) {
      toast.error("নাম এবং URL দিন");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("api_settings")
        .update(form)
        .eq("id", editing.id);
      if (error) { toast.error("আপডেট ব্যর্থ"); return; }
      toast.success("API সেটিংস আপডেট হয়েছে");
    } else {
      const { error } = await supabase
        .from("api_settings")
        .insert(form);
      if (error) { toast.error("যোগ করতে ব্যর্থ"); return; }
      toast.success("API সেটিংস যোগ হয়েছে");
    }
    setOpen(false);
    resetForm();
    fetchSettings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই API সেটিংস ডিলিট করতে চান?")) return;
    await supabase.from("api_settings").delete().eq("id", id);
    toast.success("ডিলিট হয়েছে");
    fetchSettings();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            API সেটিংস ম্যানেজমেন্ট
          </h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            নতুন API যোগ করুন
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>Endpoint URL</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate font-mono text-xs">
                      {s.endpoint_url}
                    </TableCell>
                    <TableCell>{s.region}</TableCell>
                    <TableCell>
                      {s.is_active ? (
                        <span className="text-green-600 font-semibold">✅ Active</span>
                      ) : (
                        <span className="text-red-600 font-semibold">❌ Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {settings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      কোনো API সেটিংস নেই
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
              {editing ? "এডিট" : "নতুন"} API সেটিংস
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                নাম * (e.g., player_verification)
              </label>
              <Input 
                placeholder="player_verification" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Endpoint URL *
              </label>
              <Input 
                placeholder="https://api.example.com/player" 
                value={form.endpoint_url} 
                onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Region
              </label>
              <Input 
                placeholder="SG" 
                value={form.region} 
                onChange={(e) => setForm({ ...form, region: e.target.value })} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                উদাহরণ: SG (Singapore), BD (Bangladesh), IN (India)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                বিবরণ
              </label>
              <Textarea 
                placeholder="API সম্পর্কে বিস্তারিত তথ্য..." 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                rows={3}
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

export default AdminAPISettings;
