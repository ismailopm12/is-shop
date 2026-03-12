import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/admin/ImageUpload";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Video, 
  Image as ImageIcon,
  TrendingUp,
  Calendar,
  Users,
  Upload,
  Film
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Popup {
  id: string;
  title: string;
  description?: string;
  media_type: 'image' | 'video';
  media_url: string;
  media_alt?: string;
  cta_text?: string;
  cta_link?: string;
  display_delay: number;
  display_frequency: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  target_audience: string;
  priority: number;
  views_count?: number;
  clicks_count?: number;
}

const AdminPopups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    media_type: "image",
    media_url: "",
    media_alt: "",
    cta_text: "",
    cta_link: "",
    display_delay: 3000,
    display_frequency: "once_per_session",
    is_active: true,
    start_date: "",
    end_date: "",
    target_audience: "all",
    priority: 1,
  });

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      const { data, error } = await supabase
        .from("promotional_popups" as any)
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      setPopups(data || []);
    } catch (error: any) {
      console.error("Error fetching popups:", error);
      toast({
        title: "Error",
        description: "Failed to load popups",
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = (popup?: Popup) => {
    if (popup) {
      setEditingPopup(popup);
      setFormData({
        title: popup.title,
        description: popup.description || "",
        media_type: popup.media_type,
        media_url: popup.media_url,
        media_alt: popup.media_alt || "",
        cta_text: popup.cta_text || "",
        cta_link: popup.cta_link || "",
        display_delay: popup.display_delay,
        display_frequency: popup.display_frequency,
        is_active: popup.is_active,
        start_date: popup.start_date ? new Date(popup.start_date).toISOString().slice(0, 16) : "",
        end_date: popup.end_date ? new Date(popup.end_date).toISOString().slice(0, 16) : "",
        target_audience: popup.target_audience,
        priority: popup.priority,
      });
    } else {
      setEditingPopup(null);
      setFormData({
        title: "",
        description: "",
        media_type: "image",
        media_url: "",
        media_alt: "",
        cta_text: "",
        cta_link: "",
        display_delay: 3000,
        display_frequency: "once_per_session",
        is_active: true,
        start_date: "",
        end_date: "",
        target_audience: "all",
        priority: 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const saveData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingPopup) {
        // Update existing
        const result = await supabase
          .from("promotional_popups")
          .update(saveData)
          .eq("id", editingPopup.id);
        error = result.error;
      } else {
        // Create new
        const result = await supabase
          .from("promotional_popups")
          .insert([{ ...saveData, created_at: new Date().toISOString() }]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Popup ${editingPopup ? "updated" : "created"} successfully!`,
      });
      
      setIsDialogOpen(false);
      fetchPopups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save popup: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this popup?")) return;

    try {
      const { error } = await supabase
        .from("promotional_popups" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Popup deleted successfully",
      });
      fetchPopups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete popup: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "once_per_session": return "Once per Session";
      case "every_visit": return "Every Visit";
      case "once_per_day": return "Once per Day";
      default: return freq;
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case "all": return "All Users";
      case "new_users": return "New Users Only";
      case "returning_users": return "Returning Users";
      default: return target;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotional Popups</h1>
          <p className="text-muted-foreground mt-1">Create engaging popups for offers and announcements</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Popup
        </Button>
      </div>

      {/* Popups List */}
      <div className="grid gap-4">
        {popups.map((popup) => (
          <Card key={popup.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Media Preview */}
                  <div className="w-32 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {popup.media_type === 'image' ? (
                      popup.media_url ? (
                        <img src={popup.media_url} alt={popup.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )
                    ) : (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{popup.title}</h3>
                      <Badge variant={popup.is_active ? "default" : "secondary"}>
                        {popup.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {popup.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{popup.description}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Delay: {(popup.display_delay / 1000).toFixed(1)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {getFrequencyLabel(popup.display_frequency)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {getTargetLabel(popup.target_audience)}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {popup.views_count} views • {popup.clicks_count} clicks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(popup)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(popup.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {popups.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Popups Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first promotional popup to engage users</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Popup
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPopup ? "Edit Popup" : "Create New Popup"}</DialogTitle>
            <DialogDescription>
              Configure your promotional popup settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="🎉 Special Offer!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Get 50% off on your first purchase..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Media Type</Label>
                <select
                  value={formData.media_type}
                  onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Media Upload *</Label>
                <div className="rounded-lg border border-border p-4 bg-muted/50">
                  {formData.media_type === 'image' ? (
                    <ImageUpload
                      folder="popups"
                      currentUrl={formData.media_url}
                      onUpload={(url) => setFormData({ ...formData, media_url: url })}
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        Video upload coming soon. Please use video URL for now.
                      </p>
                      <Input
                        id="media_url"
                        value={formData.media_url}
                        onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                        placeholder="https://example.com/video.mp4"
                      />
                    </div>
                  )}
                </div>
                {formData.media_url && (
                  <div className="mt-2">
                    {formData.media_type === 'image' ? (
                      <img src={formData.media_url} alt="Preview" className="h-32 w-full object-cover rounded-lg border" />
                    ) : (
                      <video src={formData.media_url} controls className="h-32 w-full object-cover rounded-lg border" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cta_text">CTA Text</Label>
                <Input
                  id="cta_text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  placeholder="Claim Now"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta_link">CTA Link</Label>
                <Input
                  id="cta_link"
                  value={formData.cta_link}
                  onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                  placeholder="/add-money"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_delay">Display Delay (ms)</Label>
                <Input
                  id="display_delay"
                  type="number"
                  value={formData.display_delay}
                  onChange={(e) => setFormData({ ...formData, display_delay: parseInt(e.target.value) })}
                  placeholder="3000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_frequency">Display Frequency</Label>
                <select
                  id="display_frequency"
                  value={formData.display_frequency}
                  onChange={(e) => setFormData({ ...formData, display_frequency: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="once_per_session">Once per Session</option>
                  <option value="every_visit">Every Visit</option>
                  <option value="once_per_day">Once per Day</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience</Label>
                <select
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="new_users">New Users Only</option>
                  <option value="returning_users">Returning Users</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.title || !formData.media_url}>
              {loading ? "Saving..." : editingPopup ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPopups;
