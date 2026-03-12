import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface SettingRow {
  id: string;
  key: string;
  value: string;
}

const AdminSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r: SettingRow) => { map[r.key] = r.value; });
      setSettings(map);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const update = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const promises = Object.entries(settings).map(([key, value]) =>
      supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key)
    );
    const results = await Promise.all(promises);
    const hasError = results.some(r => r.error);
    if (hasError) toast.error("সেভ করতে সমস্যা হয়েছে");
    else toast.success("সেটিংস সেভ হয়েছে!");
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">সাইট সেটিংস</h2>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </div>

        {/* Branding */}
        <Card>
          <CardHeader><CardTitle className="text-lg">ব্র্যান্ডিং</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">সাইটের নাম</label>
              <Input value={settings.site_name || ""} onChange={e => update("site_name", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">ট্যাগলাইন</label>
              <Input value={settings.site_tagline || ""} onChange={e => update("site_tagline", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">লোগো</label>
              <ImageUpload folder="branding" currentUrl={settings.logo_url || ""} onUpload={(url) => update("logo_url", url)} />
              <Input value={settings.logo_url || ""} onChange={e => update("logo_url", e.target.value)} placeholder="অথবা URL দিন" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">হিরো ব্যানার</label>
              <ImageUpload folder="banners" currentUrl={settings.banner_url || ""} onUpload={(url) => update("banner_url", url)} />
              <Input value={settings.banner_url || ""} onChange={e => update("banner_url", e.target.value)} placeholder="অথবা URL দিন" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Announcement */}
        <Card>
          <CardHeader><CardTitle className="text-lg">অ্যানাউন্সমেন্ট ব্যানার</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">ব্যানার অ্যাক্টিভ</label>
              <Switch
                checked={settings.announcement_active === "true"}
                onCheckedChange={v => update("announcement_active", v ? "true" : "false")}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">ব্যানার টেক্সট</label>
              <Textarea value={settings.announcement_text || ""} onChange={e => update("announcement_text", e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader><CardTitle className="text-lg">সোশ্যাল লিংক</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Telegram URL</label>
              <Input value={settings.social_telegram || ""} onChange={e => update("social_telegram", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">WhatsApp URL</label>
              <Input value={settings.social_whatsapp || ""} onChange={e => update("social_whatsapp", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Facebook URL</label>
              <Input value={settings.social_facebook || ""} onChange={e => update("social_facebook", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">YouTube URL</label>
              <Input value={settings.social_youtube || ""} onChange={e => update("social_youtube", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader><CardTitle className="text-lg">ফুটার সেটিংস</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">ফোন নম্বর</label>
              <Input value={settings.footer_phone || ""} onChange={e => update("footer_phone", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">ইমেইল</label>
              <Input value={settings.footer_email || ""} onChange={e => update("footer_email", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">কপিরাইট টেক্সট</label>
              <Input value={settings.footer_copyright || ""} onChange={e => update("footer_copyright", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">ডেভেলপার নাম</label>
              <Input value={settings.footer_developer || ""} onChange={e => update("footer_developer", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">অভিযোগ টেক্সট</label>
              <Textarea value={settings.footer_complaint_text || ""} onChange={e => update("footer_complaint_text", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSiteSettings;
