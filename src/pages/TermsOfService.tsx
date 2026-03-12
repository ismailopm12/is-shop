import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Home, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const TermsOfService = () => {
  const { settings } = useSiteSettings();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-3 pb-24 space-y-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Terms of Service</span>
        </nav>
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h1 className="font-bold text-xl mb-4">Terms of Service</h1>
          <div className="text-sm text-muted-foreground whitespace-pre-line">{settings.page_terms || ""}</div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default TermsOfService;
