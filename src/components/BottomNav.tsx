import { Home, PlusCircle, ShoppingBag, Snowflake, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: PlusCircle, label: "Add Money", path: "/add-money" },
  { icon: ShoppingBag, label: "My Orders", path: "/orders" },
  { icon: Snowflake, label: "My Codes", path: "/codes" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  const handleNavClick = (path: string) => {
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border card-shadow">
      <div className="max-w-4xl mx-auto flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = pathname === path;
          return (
            <Link 
              key={path} 
              to={path} 
              onClick={() => handleNavClick(path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
