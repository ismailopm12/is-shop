import { MessageCircle, Send } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const SocialButtons = () => {
  const { settings } = useSiteSettings();
  const telegramUrl = settings.social_telegram || "#";
  const whatsappUrl = settings.social_whatsapp || "#";

  return (
    <div className="px-4 mt-4 grid grid-cols-2 gap-3">
      <a href={telegramUrl} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-[hsl(200_80%_50%)] text-[hsl(0,0%,100%)] font-semibold text-sm card-shadow hover:opacity-90 transition">
        <Send className="h-5 w-5" />
        Join us on Telegram
      </a>
      <a href={whatsappUrl} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-[hsl(142_70%_42%)] text-[hsl(0,0%,100%)] font-semibold text-sm card-shadow hover:opacity-90 transition">
        <MessageCircle className="h-5 w-5" />
        Follow us on WhatsApp
      </a>
    </div>
  );
};

export default SocialButtons;
