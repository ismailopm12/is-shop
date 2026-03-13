import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MessageCircle, Bell, Settings, Save, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WhatsAppSettings {
  id: string;
  api_provider: string;
  instance_id: string | null;
  api_token: string | null;
  admin_number: string;
  sender_number: string | null;
  is_enabled: boolean;
  send_to_user: boolean;
  send_to_admin: boolean;
  message_template_user: string;
  message_template_admin: string;
}

const AdminWhatsAppNotifications = () => {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [testNumber, setTestNumber] = useState("");

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("whatsapp_settings" as any)
      .select("*")
      .single();
    
    if (data) {
      setSettings(data as unknown as WhatsAppSettings);
    } else {
      // Create default settings if not exists
      const { data: newData } = await supabase
        .from("whatsapp_settings" as any)
        .insert({
          admin_number: "+8801XXXXXXXXX",
          is_enabled: true,
          send_to_user: true,
          send_to_admin: true
        })
        .select()
        .single();
      
      if (newData) {
        setSettings(newData as unknown as WhatsAppSettings);
      }
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("whatsapp_settings" as any)
      .update(settings)
      .eq("id", settings.id);
    
    setLoading(false);
    
    if (error) {
      toast.error("সেটিংস সেভ ব্যর্থ");
    } else {
      toast.success("WhatsApp নোটিফিকেশন সেটিংস সেভ হয়েছে");
    }
  };

  const handleTestMessage = async () => {
    if (!testNumber || !settings?.is_enabled) {
      toast.error("টেস্টের জন্য নাম্বার দিন এবং এনাবল করুন");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc(
        'send_whatsapp_message',
        {
          _to_number: testNumber,
          _message: `🧪 টেস্ট মেসেজ\n\nএটি একটি টেস্ট WhatsApp নোটিফিকেশন।\nসময়: ${new Date().toLocaleString('bn-BD')}`
        }
      );

      if (error) throw error;

      if ((data as any)?.success) {
        toast.success("টেস্ট মেসেজ পাঠানো হয়েছে!");
      } else {
        toast.error("মেসেজ পাঠাতে ব্যর্থ: " + (data as any)?.error);
      }
    } catch (error: any) {
      toast.error("ত্রুটি: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            WhatsApp নোটিফিকেশন
          </h2>
          <Badge variant={settings.is_enabled ? "default" : "secondary"}>
            {settings.is_enabled ? "✅ সক্রিয়" : "❌ নিষ্ক্রিয়"}
          </Badge>
        </div>

        {/* Info Alert */}
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">কিভাবে কাজ করে:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>ব্যবহারকারী অর্ডার প্লেস করলে অটোমেটিক WhatsApp মেসেজ যাবে</li>
              <li>ব্যবহারকারী তার অর্ডার ডিটেইলস পাবে</li>
              <li>এডমিন নতুন অর্ডারের নোটিফিকেশন পাবে</li>
              <li>Ultramsg API ব্যবহৃত হয় (https://ultramsg.com)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              মূল সেটিংস
            </CardTitle>
            <CardDescription>WhatsApp API কনফিগারেশন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1">
                  API Provider
                </label>
                <Input value={settings.api_provider} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">
                  বর্তমানে শুধুমাত্র Ultramsg সাপোর্টেড
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Instance ID
                </label>
                <Input 
                  value={settings.instance_id || ""} 
                  onChange={(e) => setSettings({...settings, instance_id: e.target.value})}
                  placeholder="instance123"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  API Token
                </label>
                <Input 
                  value={settings.api_token || ""} 
                  onChange={(e) => setSettings({...settings, api_token: e.target.value})}
                  placeholder="your_api_token"
                  type="password"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1">
                  এডমিন WhatsApp নাম্বার *
                </label>
                <Input 
                  value={settings.admin_number} 
                  onChange={(e) => setSettings({...settings, admin_number: e.target.value})}
                  placeholder="+8801XXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  দেশ কোড সহ দিন (উদাহরণ: +8801712345678)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={settings.is_enabled} 
                  onCheckedChange={(v) => setSettings({...settings, is_enabled: v})} 
                />
                <label className="text-sm font-medium">WhatsApp নোটিফিকেশন চালু করুন</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              নোটিফিকেশন পছন্দ
            </CardTitle>
            <CardDescription>কাঁকে মেসেজ পাঠাবেন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">ব্যবহারকারীকে মেসেজ পাঠান</p>
                <p className="text-xs text-muted-foreground">অর্ডার কনফার্মেশন মেসেজ</p>
              </div>
              <Switch 
                checked={settings.send_to_user} 
                onCheckedChange={(v) => setSettings({...settings, send_to_user: v})} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">এডমিনকে মেসেজ পাঠান</p>
                <p className="text-xs text-muted-foreground">নতুন অর্ডার নোটিফিকেশন</p>
              </div>
              <Switch 
                checked={settings.send_to_admin} 
                onCheckedChange={(v) => setSettings({...settings, send_to_admin: v})} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Message Templates */}
        <Card>
          <CardHeader>
            <CardTitle>মেসেজ টেমপ্লেট</CardTitle>
            <CardDescription>কাস্টমাইজ করুন কি মেসেজ যাবে</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                ব্যবহারকারীর মেসেজ টেমপ্লেট
              </label>
              <Textarea 
                value={settings.message_template_user} 
                onChange={(e) => setSettings({...settings, message_template_user: e.target.value})}
                rows={6}
                className="font-mono text-sm"
              />
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs font-semibold mb-1">ভেরিয়েবলসমূহ:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><code>{`{order_id}`}</code> - অর্ডার ID</li>
                  <li><code>{`{product_name}`}</code> - পণ্যের নাম</li>
                  <li><code>{`{amount}`}</code> - মূল্য</li>
                  <li><code>{`{date}`}</code> - তারিখ</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                এডমিনের মেসেজ টেমপ্লেট
              </label>
              <Textarea 
                value={settings.message_template_admin} 
                onChange={(e) => setSettings({...settings, message_template_admin: e.target.value})}
                rows={6}
                className="font-mono text-sm"
              />
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs font-semibold mb-1">ভেরিয়েবলসমূহ:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><code>{`{order_id}`}</code> - অর্ডার ID</li>
                  <li><code>{`{user_name}`}</code> - ব্যবহারকারীর নাম</li>
                  <li><code>{`{product_name}`}</code> - পণ্যের নাম</li>
                  <li><code>{`{amount}`}</code> - মূল্য</li>
                  <li><code>{`{date}`}</code> - তারিখ</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              টেস্ট মেসেজ
            </CardTitle>
            <CardDescription>আপনার সেটিংস পরীক্ষা করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={testNumber} 
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="flex-1"
              />
              <Button 
                onClick={handleTestMessage}
                disabled={loading || !settings.is_enabled}
              >
                {loading ? "পাঠানো হচ্ছে..." : "টেস্ট মেসেজ পাঠান"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              এই নাম্বারে একটি টেস্ট মেসেজ যাবে
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "সেভ হচ্ছে..." : "সেটিংস সেভ করুন"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsAppNotifications;
