import { MessageCircle, Send } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SocialButton {
  id: string;
  platform: string;
  display_name: string;
  url: string;
  button_color: string;
}

const SocialButtons = () => {
  const { settings } = useSiteSettings();
  const [socialButtons, setSocialButtons] = useState<SocialButton[]>([]);

  useEffect(() => {
    const fetchSocialButtons = async () => {
      const { data } = await supabase
        .from("social_links" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      
      if (data) {
        setSocialButtons(data as unknown as SocialButton[]);
      }
    };

    fetchSocialButtons();
  }, []);

  // Fallback to site settings if no database buttons
  const telegramUrl = socialButtons.find(b => b.platform?.toLowerCase() === 'telegram')?.url || settings.social_telegram || "#";
  const whatsappUrl = socialButtons.find(b => b.platform?.toLowerCase() === 'whatsapp')?.url || settings.social_whatsapp || "#";

  // Get button configurations
  const getButtonConfig = (platform: string) => {
    const button = socialButtons.find(b => b.platform?.toLowerCase() === platform.toLowerCase());
    
    const defaults = {
      telegram: { color: "bg-[hsl(200_80%_50%)]", icon: Send, name: "Join us on Telegram" },
      whatsapp: { color: "bg-[hsl(142_70%_42%)]", icon: MessageCircle, name: "Follow us on WhatsApp" }
    };

    const config = defaults[platform as keyof typeof defaults];
    return {
      color: button?.button_color === 'blue' ? 'bg-[hsl(200_80%_50%)]' : 
             button?.button_color === 'green' ? 'bg-[hsl(142_70%_42%)]' : config.color,
      icon: config.icon,
      name: button?.display_name || config.name,
      url: platform === 'telegram' ? telegramUrl : whatsappUrl
    };
  };

  const telegramConfig = getButtonConfig('telegram');
  const whatsappConfig = getButtonConfig('whatsapp');

  return (
    <div className="px-4 mt-4 grid grid-cols-2 gap-3">
      <a 
        href={telegramConfig.url} 
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 rounded-xl px-4 py-3 ${telegramConfig.color} text-[hsl(0,0%,100%)] font-semibold text-sm card-shadow hover:opacity-90 transition hover:scale-[1.02]`}
      >
        <telegramConfig.icon className="h-5 w-5" />
        {telegramConfig.name}
      </a>
      <a 
        href={whatsappConfig.url} 
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 rounded-xl px-4 py-3 ${whatsappConfig.color} text-[hsl(0,0%,100%)] font-semibold text-sm card-shadow hover:opacity-90 transition hover:scale-[1.02]`}
      >
        <whatsappConfig.icon className="h-5 w-5" />
        {whatsappConfig.name}
      </a>
    </div>
  );
};

export default SocialButtons;
