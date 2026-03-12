import logo from "@/assets/logo.png";
import { Phone, Mail, Facebook, Youtube, MessageCircle, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const Footer = () => {
  const { settings } = useSiteSettings();

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
    <footer className="bg-gradient-to-b from-accent/50 to-background border-t border-border/50">
      <div className="max-w-6xl mx-auto px-4 py-12 pb-24">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg overflow-hidden">
                <img src={logoUrl || logo} alt={siteName} className="h-full w-full object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{siteName}</h3>
                <p className="text-xs text-primary font-semibold mt-0.5">{tagline}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              আপনার বিশ্বস্ত ডিজিটাল প্ল্যাটফর্ম। দ্রুত, নিরাপদ এবং সহজে লেনদেনের জন্য আস্থার নাম BD Games Bazar।
            </p>
            <div className="flex gap-3 pt-2">
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-accent hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-accent hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                <Youtube className="h-5 w-5" />
              </a>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-accent hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Home</Link>
              <Link to="/product/uid-topup" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Top Up</Link>
              <Link to="/digital" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Digital Products</Link>
              <Link to="/smm" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">SMM Services</Link>
              <Link to="/add-money" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Add Money</Link>
              <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">My Orders</Link>
              <Link to="/codes" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">My Codes</Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Profile</Link>
            </div>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-foreground">Contact & Info</h4>
            <div className="space-y-3">
              <a href={`tel:${phone}`} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card transition-all duration-200 group">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card transition-all duration-200 group">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{email}</span>
              </a>
            </div>
            <div className="pt-3 space-y-2">
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Contact Us</Link>
              <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Privacy Policy</Link>
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Terms of Service</Link>
              <Link to="/faq" className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200">FAQ</Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 my-6"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              {copyright}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-1">
              Developed with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by <span className="text-primary font-medium">{developer}</span>
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
          >
            অভিযোগ এবং সমস্যা
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t border-border/30">
          {complaintText}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
