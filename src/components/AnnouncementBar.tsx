import { X, Info } from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const AnnouncementBar = () => {
  const [visible, setVisible] = useState(true);
  const { settings } = useSiteSettings();

  const isActive = settings.announcement_active !== "false";
  const text = settings.announcement_text || "টপআপ করুন ২৪ ঘন্টা । যেকোনো প্রয়োজনে আমাদের সাপোর্টে যোগাযোগ করুন";

  if (!visible || !isActive) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 mx-4 mt-3 rounded-lg px-4 py-3 flex items-start gap-3">
      <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-primary font-medium flex-1">{text}</p>
      <button onClick={() => setVisible(false)} className="text-primary/60 hover:text-primary">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
