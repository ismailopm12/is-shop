import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  folder: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  className?: string;
}

const ImageUpload = ({ folder, currentUrl, onUpload, className }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ইমেজ ফাইল আপলোড করুন");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("site-assets").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast.error("আপলোড ব্যর্থ: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    setPreview(publicUrl);
    onUpload(publicUrl);
    toast.success("ইমেজ আপলোড হয়েছে!");
    setUploading(false);
  };

  const handleClear = () => {
    setPreview("");
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-border" />
          <button
            onClick={handleClear}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-2"
      >
        {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        {uploading ? "আপলোড হচ্ছে..." : "ইমেজ আপলোড"}
      </Button>
    </div>
  );
};

export default ImageUpload;
