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
    <footer className="bg-gradient-to-t from-accent/70 via-accent/30 to-background border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 pb-24">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                <img src={logoUrl || logo} alt={siteName} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">{siteName}</h3>
                <p className="text-[10px] sm:text-xs text-primary font-semibold mt-0.5 whitespace-nowrap">{tagline}</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
              আপনার বিশ্বস্ত ডিজিটাল প্ল্যাটফর্ম। দ্রুত, নিরাপদ এবং সহজে লেনদেনের জন্য আস্থার নাম BD Games Bazar।
            </p>
            <div className="flex gap-2 sm:gap-3 pt-1">
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-accent/80 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 shadow-sm">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-accent/80 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 shadow-sm">
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-accent/80 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 shadow-sm">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Home</Link>
              <Link to="/product/uid-topup" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Top Up</Link>
              <Link to="/digital" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Digital</Link>
              <Link to="/smm" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">SMM</Link>
              <Link to="/add-money" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Add Money</Link>
              <Link to="/orders" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Orders</Link>
              <Link to="/codes" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Codes</Link>
              <Link to="/profile" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">Profile</Link>
            </div>
          </div>

          {/* Contact & Legal - Hidden on small mobile, shown on larger */}
          <div className="hidden sm:block space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-bold text-foreground">Contact & Info</h4>
            <div className="space-y-2">
              <a href={`tel:${phone}`} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card/50 hover:bg-card transition-all duration-200 group">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card/50 hover:bg-card transition-all duration-200 group">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground truncate">{email}</span>
              </a>
            </div>
            <div className="pt-2 space-y-1.5">
              <Link to="/contact" className="block text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Contact Us</Link>
              <Link to="/privacy" className="block text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Privacy Policy</Link>
              <Link to="/terms" className="block text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Terms of Service</Link>
              <Link to="/faq" className="block text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200">FAQ</Link>
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
