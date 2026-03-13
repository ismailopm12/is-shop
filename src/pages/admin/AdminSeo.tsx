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
  TrendingUp,
  BarChart3,
  Settings,
  FileText,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LayoutGrid
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
    bing_site_verification: "",
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
    custom_tracking_code: "",
  });

  const seoPages = [
    { name: "Homepage", url: "/", description: "Main landing page" },
    { name: "Free Fire Top-up", url: "/products/1", description: "Free Fire diamond top-up page" },
    { name: "Digital Products", url: "/digital-products", description: "All digital products listing" },
    { name: "SMM Services", url: "/smm-products", description: "Social Media Marketing services" },
    { name: "Add Money", url: "/add-money", description: "Wallet recharge page" },
    { name: "My Orders", url: "/my-orders", description: "User order history" },
    { name: "My Codes", url: "/my-codes", description: "Purchased voucher codes" },
    { name: "Profile", url: "/profile", description: "User profile settings" },
    { name: "Contact Us", url: "/contact-us", description: "Contact information and form" },
    { name: "FAQ", url: "/faq", description: "Frequently Asked Questions" },
    { name: "Privacy Policy", url: "/privacy-policy", description: "Privacy policy page" },
    { name: "Terms of Service", url: "/terms-of-service", description: "Terms and conditions" },
    { name: "Downloads", url: "/downloads", description: "Download resources" },
    { name: "Login", url: "/login", description: "User login page" },
    { name: "Register", url: "/register", description: "User registration page" },
  ];

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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Professional SEO Management
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Optimize your website for search engines and social media
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('https://search.google.com/search-console', '_blank')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Google Console
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-gradient-to-r from-primary to-secondary">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </div>
        
        {/* SEO Health Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SEO Score</p>
                  <p className="text-2xl font-bold text-green-600">85/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meta Tags</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {seoData.site_title && seoData.site_description ? '✓ Complete' : '⚠ Incomplete'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Share2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Social Ready</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {seoData.og_image_url ? '✓ Yes' : '⚠ Missing'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issues</p>
                  <p className="text-2xl font-bold text-orange-600">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-primary/10 to-secondary/10 p-1 rounded-lg">
          <TabsTrigger value="basic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Globe className="h-4 w-4 mr-2" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Code className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="verification" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verify
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="pages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Pages
          </TabsTrigger>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="site_title">Site Title *</Label>
                  <span className="text-xs text-muted-foreground">{seoData.site_title?.length || 0}/60 chars</span>
                </div>
                <Input
                  id="site_title"
                  value={seoData.site_title || ""}
                  onChange={(e) => handleChange("site_title", e.target.value)}
                  placeholder="BD Games Bazar - Your Trusted Gaming Platform"
                  className={(seoData.site_title?.length || 0) > 60 ? "border-orange-500" : ""}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Recommended: 50-60 characters. This appears in search results.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="site_description">Site Description *</Label>
                  <span className="text-xs text-muted-foreground">{seoData.site_description?.length || 0}/160 chars</span>
                </div>
                <Textarea
                  id="site_description"
                  value={seoData.site_description || ""}
                  onChange={(e) => handleChange("site_description", e.target.value)}
                  placeholder="Top up Free Fire, buy vouchers, and get digital products..."
                  rows={3}
                  className={(seoData.site_description?.length || 0) > 160 ? "border-orange-500" : ""}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Recommended: 150-160 characters. Brief description of your site.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_keywords">Site Keywords</Label>
                <Input
                  id="site_keywords"
                  value={seoData.site_keywords || ""}
                  onChange={(e) => handleChange("site_keywords", e.target.value)}
                  placeholder="free fire topup, game recharge, digital products, bd games"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  Comma-separated keywords for better SEO
                </p>
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
                <CheckCircle2 className="h-5 w-5" />
                Site Verification
              </CardTitle>
              <CardDescription>Verify ownership with search engines and analytics platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_site_verification">Google Site Verification</Label>
                <Input
                  id="google_site_verification"
                  value={seoData.google_site_verification || ""}
                  onChange={(e) => handleChange("google_site_verification", e.target.value)}
                  placeholder="google-site-verification=..."
                  className="font-mono text-sm"
                />
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Get this from Google Search Console → Settings → Ownership verification
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_app_id">Facebook App ID</Label>
                <Input
                  id="facebook_app_id"
                  value={seoData.facebook_app_id || ""}
                  onChange={(e) => handleChange("facebook_app_id", e.target.value)}
                  placeholder="1234567890"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Share2 className="h-3 w-3" />
                  Required for Facebook Domain Insights and social analytics
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bing_site_verification">Bing Webmaster Tools Verification</Label>
                <Input
                  id="bing_site_verification"
                  value={seoData.bing_site_verification || ""}
                  onChange={(e) => handleChange("bing_site_verification", e.target.value)}
                  placeholder="bing-site-verification=..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">From Bing Webmaster Tools</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Tracking Codes
              </CardTitle>
              <CardDescription>Add tracking codes for analytics and conversion monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_analytics_id">Google Analytics Tracking ID</Label>
                <Input
                  id="google_analytics_id"
                  value={seoData.google_analytics_id || ""}
                  onChange={(e) => handleChange("google_analytics_id", e.target.value)}
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Format: G-XXXXXXXXXX (GA4) or UA-XXXXXXXXX-X (Universal)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_tag_manager_id">Google Tag Manager Container ID</Label>
                <Input
                  id="google_tag_manager_id"
                  value={seoData.google_tag_manager_id || ""}
                  onChange={(e) => handleChange("google_tag_manager_id", e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Manage all your tags in one place</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                <Input
                  id="facebook_pixel_id"
                  value={seoData.facebook_pixel_id || ""}
                  onChange={(e) => handleChange("facebook_pixel_id", e.target.value)}
                  placeholder="1234567890123456"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Share2 className="h-3 w-3" />
                  Track conversions and build custom audiences
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_tracking_code">Custom Header Scripts</Label>
                <Textarea
                  id="custom_tracking_code"
                  value={seoData.custom_tracking_code || ""}
                  onChange={(e) => handleChange("custom_tracking_code", e.target.value)}
                  placeholder="<script>/* Your custom tracking code here */</script>"
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  Add custom scripts to the <code>&lt;head&gt;</code> section
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                SEO Pages Management
              </CardTitle>
              <CardDescription>Manage and preview SEO settings for all pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  All Website Pages ({seoPages.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {seoPages.map((page, index) => (
                    <a
                      key={index}
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {page.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {page.description}
                          </p>
                          <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1.5 inline-block">
                            {page.url}
                          </code>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Page-Specific SEO Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Globe className="h-4 w-4" />
                      Homepage SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <p>• Include primary keywords in title and description</p>
                    <p>• Use compelling call-to-action</p>
                    <p>• Optimize OG image for social sharing</p>
                    <p>• Add schema markup for organization</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <FileText className="h-4 w-4" />
                      Product Pages SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-purple-700 dark:text-purple-400">
                    <p>• Use specific product names in titles</p>
                    <p>• Include pricing and features in description</p>
                    <p>• Add product schema markup</p>
                    <p>• Use high-quality product images</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Policy Pages SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-green-700 dark:text-green-400">
                    <p>• Use clear, descriptive titles</p>
                    <p>• Include "Policy" or "Terms" in meta tags</p>
                    <p>• Add legal organization schema</p>
                    <p>• Keep URLs clean and descriptive</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <BarChart3 className="h-4 w-4" />
                      User Pages SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
                    <p>• No-index login/register pages</p>
                    <p>• Secure authentication flows</p>
                    <p>• Fast page load times</p>
                    <p>• Mobile-first design</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Site
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open('https://search.google.com/search-console', '_blank')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Google Console
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open('https://www.bing.com/webmasters', '_blank')}>
                  <Search className="mr-2 h-4 w-4" />
                  Bing Webmaster
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open('https://developers.facebook.com/docs/sharing/debugger', '_blank')}>
                  <Share2 className="mr-2 h-4 w-4" />
                  FB Debugger
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Live Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Search Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Google Search Preview
            </CardTitle>
            <CardDescription>Desktop search result appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4 space-y-1 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                  B
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">BD Games Bazar</p>
                  <p className="text-xs text-gray-500">https://bdgamesbazar.com</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-blue-800 dark:text-blue-400 text-lg font-medium hover:underline cursor-pointer">
                  {seoData.site_title || "Your Site Title - Professional Gaming Platform"}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                  {seoData.site_description || "Your site description will appear here. Make it compelling and include relevant keywords..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Media Preview (Facebook/LinkedIn)
            </CardTitle>
            <CardDescription>How your link appears when shared</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden bg-white dark:bg-gray-900">
              {seoData.og_image_url ? (
                <img 
                  src={seoData.og_image_url} 
                  alt="OG Preview" 
                  className="w-full h-48 object-cover"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/1200x630?text=No+Image')}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {seoData.canonical_url || "https://bdgamesbazar.com"}
                </p>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  {seoData.og_title || seoData.site_title || "Your Site Title"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {seoData.og_description || seoData.site_description || "Your site description will appear here..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Tips */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertCircle className="h-5 w-5" />
            Professional SEO Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Title Optimization
              </h4>
              <p className="text-sm text-orange-600 dark:text-orange-500">
                Keep titles between 50-60 characters. Include primary keywords at the beginning for better rankings.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Description Best Practices
              </h4>
              <p className="text-sm text-orange-600 dark:text-orange-500">
                Write compelling descriptions (150-160 chars). Include a call-to-action and relevant keywords naturally.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Image Optimization
              </h4>
              <p className="text-sm text-orange-600 dark:text-orange-500">
                Use 1200x630px images for social media. Compress images for faster loading and better SEO scores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeo;
