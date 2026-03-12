import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { LogOut, Shield, Wallet } from "lucide-react";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  const handleNavClick = () => {
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const siteName = settings.site_name || "GAMES BAZAR";
  const tagline = settings.site_tagline || "মুহূর্তেই টপআপ";
  const logoUrl = settings.logo_url || "";

  return (
    <header className="sticky top-0 z-50 bg-card card-shadow border-b border-border">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
        <Link to="/" onClick={handleNavClick} className="flex items-center gap-2">
          <img src={logoUrl || logo} alt={siteName} className="h-10 w-10 rounded-lg" />
          <div className="leading-tight">
            <span className="text-lg font-bold tracking-tight">{siteName}</span>
            <p className="text-xs text-primary font-semibold -mt-1">{tagline}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Wallet Balance - Always Visible */}
              <Link to="/add-money" onClick={handleNavClick}>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/80 hover:bg-accent transition cursor-pointer border border-border">
                  <Wallet className="h-4 w-4 text-primary" />
                  <Badge variant="secondary" className="bg-background text-foreground font-bold text-xs ml-0.5">
                    ৳{profile?.balance?.toFixed(2) || "0.00"}
                  </Badge>
                </div>
              </Link>

              {isAdmin && (
                <Link to="/admin" onClick={handleNavClick}>
                  <Button size="sm" variant="outline" className="text-sm gap-1 border-primary text-primary">
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Button>
                </Link>
              )}
              
              <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                {profile?.display_name || user.email?.split("@")[0]}
              </span>
              
              <Button size="sm" variant="outline" onClick={signOut} className="text-sm gap-1">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/register" onClick={handleNavClick}>
                <Button variant="outline" size="sm" className="text-sm font-medium">Register</Button>
              </Link>
              <Link to="/login" onClick={handleNavClick}>
                <Button size="sm" className="text-sm font-medium bg-foreground text-card hover:bg-foreground/90">Login</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
