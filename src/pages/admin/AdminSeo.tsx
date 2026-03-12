import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Globe, 
  Search, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Code,
  Eye,
  TrendingUp
} from "lucide-react";

const AdminSeo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seoData, setSeoData] = useState<any>({
    site_title: "",
    site_description: "",
    site_keywords: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    twitter_card: "summary_large_image",
    canonical_url: "",
    robots_meta: "index, follow",
    schema_markup: null,
    google_site_verification: "",
    facebook_app_id: "",
  });

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  const fetchSeoSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("seo_settings" as any)
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setSeoData(data);
      }
    } catch (error: any) {
      console.error("Error fetching SEO settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("seo_settings" as any)
        .upsert({ id: seoData.id, ...seoData, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast({
        title: "SEO Settings Saved",
        description: "Your SEO configuration has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save SEO settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setSeoData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Management</h1>
          <p className="text-muted-foreground mt-1">Optimize your website for search engines</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        {/* Basic SEO */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Core SEO metadata for your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_title">Site Title *</Label>
                <Input
                  id="site_title"
                  value={seoData.site_title || ""}
                  onChange={(e) => handleChange("site_title", e.target.value)}
                  placeholder="BD Games Bazar - Your Trusted Gaming Platform"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 50-60 characters. This appears in search results.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description *</Label>
                <Textarea
                  id="site_description"
                  value={seoData.site_description || ""}
                  onChange={(e) => handleChange("site_description", e.target.value)}
                  placeholder="Top up Free Fire, buy vouchers, and get digital products..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 150-160 characters. Brief description of your site.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_keywords">Site Keywords</Label>
                <Input
                  id="site_keywords"
                  value={seoData.site_keywords || ""}
                  onChange={(e) => handleChange("site_keywords", e.target.value)}
                  placeholder="free fire topup, game recharge, digital products"
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonical_url">Canonical URL</Label>
                <Input
                  id="canonical_url"
                  value={seoData.canonical_url || ""}
                  onChange={(e) => handleChange("canonical_url", e.target.value)}
                  placeholder="https://bdgamesbazar.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Open Graph & Social Media
              </CardTitle>
              <CardDescription>How your site appears on social media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og_title">Open Graph Title</Label>
                <Input
                  id="og_title"
                  value={seoData.og_title || ""}
                  onChange={(e) => handleChange("og_title", e.target.value)}
                  placeholder="BD Games Bazar - Premium Gaming Platform"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_description">Open Graph Description</Label>
                <Textarea
                  id="og_description"
                  value={seoData.og_description || ""}
                  onChange={(e) => handleChange("og_description", e.target.value)}
                  placeholder="Instant game topups, digital products, and vouchers..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image_url">Open Graph Image URL</Label>
                <Input
                  id="og_image_url"
                  value={seoData.og_image_url || ""}
                  onChange={(e) => handleChange("og_image_url", e.target.value)}
                  placeholder="https://bdgamesbazar.com/og-image.jpg"
                />
                <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_card">Twitter Card Type</Label>
                <select
                  id="twitter_card"
                  value={seoData.twitter_card || "summary_large_image"}
                  onChange={(e) => handleChange("twitter_card", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                  <option value="app">App</option>
                  <option value="player">Player</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced SEO */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Advanced SEO
              </CardTitle>
              <CardDescription>Technical SEO settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="robots_meta">Robots Meta Tag</Label>
                <select
                  id="robots_meta"
                  value={seoData.robots_meta || "index, follow"}
                  onChange={(e) => handleChange("robots_meta", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="index, follow">Index, Follow</option>
                  <option value="noindex, nofollow">No Index, No Follow</option>
                  <option value="index, nofollow">Index, No Follow</option>
                  <option value="noindex, follow">No Index, Follow</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schema_markup">Schema.org Markup (JSON-LD)</Label>
                <Textarea
                  id="schema_markup"
                  value={seoData.schema_markup ? JSON.stringify(seoData.schema_markup, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleChange("schema_markup", parsed);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">Structured data for rich search results</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Site Verification
              </CardTitle>
              <CardDescription>Verify your site with search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_site_verification">Google Site Verification</Label>
                <Input
                  id="google_site_verification"
                  value={seoData.google_site_verification || ""}
                  onChange={(e) => handleChange("google_site_verification", e.target.value)}
                  placeholder="google-site-verification=..."
                />
                <p className="text-xs text-muted-foreground">From Google Search Console</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_app_id">Facebook App ID</Label>
                <Input
                  id="facebook_app_id"
                  value={seoData.facebook_app_id || ""}
                  onChange={(e) => handleChange("facebook_app_id", e.target.value)}
                  placeholder="1234567890"
                />
                <p className="text-xs text-muted-foreground">For Facebook Insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Search Result Preview
          </CardTitle>
          <CardDescription>How your site will appear in Google</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 space-y-1">
            <div className="text-blue-800 dark:text-blue-400 text-lg font-medium">
              {seoData.site_title || "Your Site Title"}
            </div>
            <div className="text-green-700 dark:text-green-500 text-sm">
              https://bdgamesbazar.com
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              {seoData.site_description || "Your site description will appear here..."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeo;
