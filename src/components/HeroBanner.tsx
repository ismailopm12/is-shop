import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import banner from "@/assets/freefire-banner.jpg";

interface HeroBannerItem {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
}

const HeroBanner = () => {
  const { settings } = useSiteSettings();
  const [banners, setBanners] = useState<HeroBannerItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from("hero_banners")
        .select("id, image_url, title, link_url")
        .eq("is_active", true)
        .order("sort_order");
      if (data && data.length > 0) {
        setBanners(data);
      }
    };
    fetchBanners();
  }, []);

  const goToNext = useCallback(() => {
    if (banners.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(prev => (prev + 1) % banners.length);
      setIsTransitioning(false);
    }, 500);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(goToNext, 4000);
    return () => clearInterval(interval);
  }, [banners.length, goToNext]);

  // Fallback to site settings banner or default
  if (banners.length === 0) {
    const fallback = settings.banner_url || "";
    return (
      <div className="px-4 mt-4 mb-6">
        <div className="rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <img src={fallback || banner} alt="Banner" className="w-full h-44 sm:h-56 object-cover" />
        </div>
      </div>
    );
  }

  const currentBanner = banners[current];

  const content = (
    <div className="px-4 mt-4 mb-6">
      <div className="rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 relative">
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title || "Banner"}
          className={`w-full h-40 sm:h-56 object-cover transition-all duration-500 ease-in-out ${
            isTransitioning ? "opacity-0 translate-x-[-30px]" : "opacity-100 translate-x-0"
          }`}
        />
        {currentBanner.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3">
            <p className="text-primary-foreground text-sm font-semibold">{currentBanner.title}</p>
          </div>
        )}
        {banners.length > 1 && (
          <div className="absolute bottom-2 right-3 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? "bg-primary-foreground w-5" : "bg-primary-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (currentBanner.link_url) {
    return <a href={currentBanner.link_url} target="_blank" rel="noopener noreferrer">{content}</a>;
  }

  return content;
};

export default HeroBanner;
