import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";

const AdminPages = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(r => { map[r.key] = r.value; });
      setSettings(map);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const update = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const keys = ["video_tutorial_url", "page_contact_us", "page_privacy_policy", "page_faq", "page_terms"];
    for (const key of keys) {
      if (settings[key] !== undefined) {
        // Try update first, then insert if no row exists
        const { data } = await supabase.from("site_settings").update({ value: settings[key] }).eq("key", key).select();
        if (!data || data.length === 0) {
          await supabase.from("site_settings").insert({ key, value: settings[key] });
        }
      }
    }
    toast.success("সেভ হয়েছে!");
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">পেজ কন্টেন্ট</h2>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">ভিডিও টিউটোরিয়াল (Add Money)</CardTitle></CardHeader>
          <CardContent>
            <Input
              placeholder="YouTube Embed URL (যেমন https://www.youtube.com/embed/xxxxx)"
              value={settings.video_tutorial_url || ""}
              onChange={e => update("video_tutorial_url", e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Contact Us</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={settings.page_contact_us || ""}
              onChange={e => update("page_contact_us", e.target.value)}
              rows={8}
              placeholder="Contact Us পেজের কন্টেন্ট..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Privacy Policy</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={settings.page_privacy_policy || ""}
              onChange={e => update("page_privacy_policy", e.target.value)}
              rows={10}
              placeholder="Privacy Policy পেজের কন্টেন্ট..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">FAQ</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={settings.page_faq || ""}
              onChange={e => update("page_faq", e.target.value)}
              rows={10}
              placeholder="FAQ পেজের কন্টেন্ট..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Terms of Service</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={settings.page_terms || ""}
              onChange={e => update("page_terms", e.target.value)}
              rows={10}
              placeholder="Terms of Service পেজের কন্টেন্ট..."
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPages;
