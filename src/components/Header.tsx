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
    <header className="sticky top-0 z-50 bg-card shadow-lg border-b border-border/50">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-3 sm:px-4 py-2.5">
        {/* Logo Section */}
        <Link to="/" onClick={handleNavClick} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <img src={logoUrl || logo} alt={siteName} className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex-shrink-0" />
          <div className="leading-tight min-w-0">
            <span className="text-base sm:text-lg font-bold tracking-tight block truncate">{siteName}</span>
            <p className="text-[10px] sm:text-xs text-primary font-semibold -mt-0.5 whitespace-nowrap">{tagline}</p>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {user ? (
            <>
              {/* Wallet Balance - Compact Mobile View */}
              <Link to="/add-money" onClick={handleNavClick}>
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-accent/80 hover:bg-accent transition cursor-pointer border border-border/50">
                  <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <Badge variant="secondary" className="bg-background text-foreground font-bold text-[10px] sm:text-xs ml-0.5 whitespace-nowrap">
                    ৳{profile?.balance?.toFixed(2) || "0.00"}
                  </Badge>
                </div>
              </Link>

              {/* Admin Button - Hidden on small mobile */}
              {isAdmin && (
                <Link to="/admin" onClick={handleNavClick}>
                  <Button size="sm" variant="outline" className="hidden sm:flex text-xs gap-1 border-primary text-primary px-2 sm:px-3">
                    <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                </Link>
              )}
              
              {/* Username - Only medium+ screens */}
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground hidden md:block truncate max-w-[100px] lg:max-w-[150px]">
                {profile?.display_name || user.email?.split("@")[0]}
              </span>
              
              {/* Logout Button */}
              <Button size="sm" variant="outline" onClick={signOut} className="text-xs gap-0 sm:gap-1 px-2 sm:px-3 h-8 sm:h-9">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              {/* Register/Login Buttons for Guests */}
              <Link to="/register" onClick={handleNavClick}>
                <Button variant="outline" size="sm" className="text-xs font-medium px-2 sm:px-3 h-8 sm:h-9">
                  <span className="hidden sm:inline">Register</span>
                  <span className="sm:hidden">Reg</span>
                </Button>
              </Link>
              <Link to="/login" onClick={handleNavClick}>
                <Button size="sm" className="text-xs font-medium bg-foreground text-card hover:bg-foreground/90 px-2 sm:px-3 h-8 sm:h-9">
                  <span className="hidden sm:inline">Login</span>
                  <span className="sm:hidden">Log In</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
