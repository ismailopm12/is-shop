import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Popup {
  id: string;
  title: string;
  description?: string;
  media_type: 'image' | 'video';
  media_url: string;
  cta_text?: string;
  cta_link?: string;
  display_delay: number;
  display_frequency: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  target_audience: string;
  priority: number;
}

const PromotionalPopup = () => {
  const { user } = useAuth();
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if popup was already shown based on frequency
    const shouldShowPopup = checkDisplayFrequency();
    
    if (shouldShowPopup) {
      fetchActivePopup();
    }
  }, [user]);

  const checkDisplayFrequency = (): boolean => {
    const lastShown = localStorage.getItem('last_popup_shown');
    const now = Date.now();

    if (!lastShown) return true;

    const hoursSinceLastShow = (now - parseInt(lastShown)) / (1000 * 60 * 60);
    
    // Check different frequencies
    // This is simplified - in production you'd store frequency per popup
    return hoursSinceLastShow >= 24; // Default: once per day
  };

  const fetchActivePopup = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data: popups, error } = await supabase
        .from("promotional_popups")
        .select("*")
        .eq("is_active", true)
        .lte("display_delay", 5000) // Only popups with reasonable delay
        .order("priority", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!popups || popups.length === 0) return;

      // Filter by date range
      const validPopups = popups.filter(p => {
        if (p.start_date && new Date(p.start_date) > new Date()) return false;
        if (p.end_date && new Date(p.end_date) < new Date()) return false;
        return true;
      });

      if (validPopups.length === 0) return;

      // Select highest priority popup
      const popup = validPopups[0];
      setCurrentPopup(popup);

      // Show popup after delay
      setTimeout(() => {
        setIsVisible(true);
        // Record that popup was shown
        localStorage.setItem('last_popup_shown', Date.now().toString());
        
        // Track view (increment counter)
        incrementViewCount(popup.id);
      }, popup.display_delay);

    } catch (error: any) {
      console.error("Error fetching popup:", error.message);
    }
  };

  const incrementViewCount = async (popupId: string) => {
    try {
      const { data: popup } = await supabase
        .from("promotional_popups")
        .select("views_count")
        .eq("id", popupId)
        .single();

      if (popup) {
        await supabase
          .from("promotional_popups")
          .update({ views_count: (popup.views_count || 0) + 1 })
          .eq("id", popupId);
      }
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setCurrentPopup(null);
    }, 300);
  };

  const handleCTAClick = () => {
    if (currentPopup?.cta_link) {
      // Track click
      incrementClickCount(currentPopup.id);
      window.location.href = currentPopup.cta_link;
      handleClose();
    }
  };

  const incrementClickCount = async (popupId: string) => {
    try {
      const { data: popup } = await supabase
        .from("promotional_popups")
        .select("clicks_count")
        .eq("id", popupId)
        .single();

      if (popup) {
        await supabase
          .from("promotional_popups")
          .update({ clicks_count: (popup.clicks_count || 0) + 1 })
          .eq("id", popupId);
      }
    } catch (error) {
      console.error("Error updating click count:", error);
    }
  };

  if (!currentPopup || !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Popup Content */}
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-border/50 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Media */}
        <div className="relative aspect-video bg-muted">
          {currentPopup.media_type === 'image' ? (
            <img 
              src={currentPopup.media_url} 
              alt={currentPopup.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              src={currentPopup.media_url}
              controls
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
            />
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h3 className="text-2xl font-bold text-foreground">{currentPopup.title}</h3>
          
          {currentPopup.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentPopup.description}
            </p>
          )}

          {currentPopup.cta_text && (
            <Button 
              onClick={handleCTAClick}
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold py-6 text-base hover:opacity-90 transition-opacity"
            >
              {currentPopup.cta_text}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionalPopup;
