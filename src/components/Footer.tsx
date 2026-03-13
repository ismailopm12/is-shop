import logo from "@/assets/logo.png";
import { Phone, Mail, Facebook, Youtube, MessageCircle, MapPin, Heart, Clock, Shield, Zap, Users, Send, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Developer {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
}

const Footer = () => {
  const { settings } = useSiteSettings();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    // Fetch active developers
    const fetchDevelopers = async () => {
      try {
        const { data } = await supabase
          .from("developers" as any)
          .select("id, name, role, image_url")
          .eq("is_active", true)
          .order("sort_order")
          .limit(3);
        if (data) setDevelopers(data as unknown as Developer[]);
      } catch (error) {
        console.error("Error fetching developers:", error);
      }
    };

    // Fetch active social links
    const fetchSocialLinks = async () => {
      try {
        const { data } = await supabase
          .from("social_links" as any)
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        if (data) setSocialLinks(data as any[]);
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    };

    fetchDevelopers();
    fetchSocialLinks();
  }, []);

  const siteName = settings.site_name || "GAMES BAZAR";
  const tagline = settings.site_tagline || "মুহূর্তেই টপআপ";
  const logoUrl = settings.logo_url || "";
  const phone = settings.footer_phone || "09613827683";
  const email = settings.footer_email || "bdgamesbazar.net@gmail.com";
  const copyright = settings.footer_copyright || "© 2026 BD Games Bazar All rights reserved.";
  const developer = settings.footer_developer || "FR Nahin";
  const complaintText = settings.footer_complaint_text || "ওয়েবসাইটে কোন সমস্যা থাকলে এখানে অভিযোগ জানাতে পারে।";
  const fbUrl = settings.social_facebook || "#";
  const ytUrl = settings.social_youtube || "#";
  const waUrl = settings.social_whatsapp || "#";

  return (
    <footer className="bg-gradient-to-t from-accent/80 via-accent/40 to-background border-t border-border/50 relative overflow-hidden mt-12">
      {/* Enhanced Bottom Shadow with Smooth Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-80"></div>
      
      {/* Main Footer Container - Rounded & Shadow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 pb-28 relative z-10">
        {/* Content Wrapper with Rounded Corners and Shadow */}
        <div className="bg-card/30 backdrop-blur-sm rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-border/50 p-6 sm:p-8 lg:p-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10">
          
          {/* Brand Section - Enhanced */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ring-4 ring-primary/10">
                <img src={logoUrl || logo} alt={siteName} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-foreground truncate">{siteName}</h3>
                <p className="text-xs text-primary font-semibold mt-0.5 whitespace-nowrap">{tagline}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              আপনার বিশ্বস্ত ডিজিটাল প্ল্যাটফর্ম। দ্রুত, নিরাপদ এবং সহজে লেনদেনের জন্য আস্থার নাম BD Games Bazar।
            </p>
            
            {/* Trust Badges */}
            <div className="flex gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[10px] font-medium">নিরাপদ</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-[10px] font-medium">দ্রুত</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] font-medium">২৪/৭</span>
              </div>
            </div>

            {/* Social Links - Enhanced */}
            <div className="flex gap-2.5 pt-2">
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border border-primary/20">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500/10 to-red-500/20 hover:from-red-500/20 hover:to-red-500/30 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border border-red-500/20">
                <Youtube className="h-4 w-4" />
              </a>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/20 hover:from-green-500/20 hover:to-green-500/30 flex items-center justify-center text-muted-foreground hover:text-green-500 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border border-green-500/20">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links - Enhanced */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                Home
              </Link>
              <Link to="/product/uid-topup" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                Top Up
              </Link>
              <Link to="/digital" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                Digital
              </Link>
              <Link to="/smm" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                SMM
              </Link>
              <Link to="/add-money" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                Add Money
              </Link>
              <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                Orders
              </Link>
              <Link to="/codes" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                Codes
              </Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block group">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary"></span>
                Profile
              </Link>
            </div>
          </div>

          {/* Contact & Info - Enhanced */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-foreground">Contact & Info</h4>
            <div className="space-y-2.5">
              <a href={`tel:${phone}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-card/60 hover:bg-card transition-all duration-200 group border border-border/30 hover:border-primary/30">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/15 to-primary/25 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/35 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-card/60 hover:bg-card transition-all duration-200 group border border-border/30 hover:border-primary/30">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/15 to-primary/25 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/35 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{email}</span>
              </a>
            </div>
            <div className="pt-3 space-y-2">
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1">Contact Us</Link>
              <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1">Privacy Policy</Link>
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1">Terms of Service</Link>
              <Link to="/faq" className="block text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1">FAQ</Link>
            </div>
          </div>

          {/* Features Section - NEW */}
          <div className="hidden lg:block space-y-4">
            <h4 className="text-base font-bold text-foreground">Why Choose Us?</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-card/60 border border-border/30">
                <div className="h-8 w-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-foreground">100% Secure</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">নিরাপদ পেমেন্ট সিস্টেম</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-card/60 border border-border/30">
                <div className="h-8 w-8 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-foreground">Instant Delivery</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">তাৎক্ষণিক ডেলিভারি</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-card/60 border border-border/30">
                <div className="h-8 w-8 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-foreground">24/7 Support</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">সর্বদা প্রস্তুত সাপোর্ট</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links - Dynamic from Database */}
          {socialLinks.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Connect With Us
              </h4>
              <div className="space-y-2">
                {socialLinks.map((link) => {
                  const getIcon = () => {
                    switch(link.platform?.toLowerCase()) {
                      case 'telegram': return Send;
                      case 'whatsapp': return MessageCircle;
                      case 'facebook': return Facebook;
                      default: return Globe;
                    }
                  };
                  const IconComponent = getIcon();
                  const colorClass = link.button_color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 
                                   link.button_color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                                   'bg-primary hover:bg-primary/90';
                                   
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full py-3 px-4 ${colorClass} text-white rounded-lg font-semibold text-center transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{link.display_name || link.platform}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Divider - Enhanced */}
        <div className="border-t-2 border-border/50 my-8 relative">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-1 rounded-full">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          </div>
        </div>

        {/* Bottom Bar - Enhanced */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 pt-8">
          <div className="text-center lg:text-left space-y-2">
            <p className="text-sm text-muted-foreground">
              {copyright}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center lg:justify-start gap-1.5 flex-wrap">
              Developed with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" /> by{" "}
              {developers.length > 0 ? (
                <span className="flex items-center gap-2 flex-wrap">
                  {developers.map((dev, index) => (
                    <Link 
                      key={dev.id} 
                      to={`/developer/${dev.id}`}
                      className="group inline-flex items-center gap-1.5 text-primary font-semibold hover:underline transition-all"
                    >
                      {dev.image_url && (
                        <img 
                          src={dev.image_url} 
                          alt={dev.name}
                          className="w-4 h-4 rounded-full object-cover border border-primary/30"
                        />
                      )}
                      {dev.name}
                      {index < developers.length - 1 && ","}
                    </Link>
                  ))}
                </span>
              ) : (
                <span className="text-primary font-semibold hover:underline cursor-pointer">{developer}</span>
              )}
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl border border-primary/30"
          >
            অভিযোগ এবং সমস্যা
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6 pt-6 border-t border-border/30">
          {complaintText}
        </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
