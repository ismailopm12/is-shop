import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface UserInfoField {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "number" | "tel";
}

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  image_url: string | null;
  category: string;
  category_id?: string;
  description: string | null;
  is_active: boolean;
  is_voucher: boolean;
  user_info_fields?: UserInfoField[];
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryText, setCategoryText] = useState("FREE FIRE");
  const [description, setDescription] = useState("");
  const [isVoucher, setIsVoucher] = useState(false);
  const [userInfoFields, setUserInfoFields] = useState<UserInfoField[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "email" | "number" | "tel">("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  
  const predefinedFieldOptions = [
    { id: "game_uid", label: "Game UID", placeholder: "Enter your game UID", type: "text" as const },
    { id: "whatsapp", label: "WhatsApp Number", placeholder: "+880...", type: "tel" as const },
    { id: "email", label: "Gmail/Email", placeholder: "your@email.com", type: "email" as const },
    { id: "phone", label: "Phone Number", placeholder: "017...", type: "tel" as const },
    { id: "username", label: "Username", placeholder: "Your username", type: "text" as const },
  ];

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data as Product[]);
  };
  
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("product_categories" as any).select("id, name, slug");
    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }
    if (data) setCategories(data as Category[]);
  };

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName(""); 
    setSlug(""); 
    setImageUrl(""); 
    setCategoryId("");
    setCategoryText("FREE FIRE"); 
    setDescription(""); 
    setIsVoucher(false);
    setUserInfoFields([]);
  };

  const handleAdd = async () => {
    if (!name || !slug) { toast.error("নাম ও স্লাগ দিন"); return; }
    const { error } = await supabase.from("products").insert({
      name, 
      slug, 
      image_url: imageUrl || null, 
      category: categoryText, 
      category_id: categoryId || null,
      description, 
      is_voucher: isVoucher,
      user_info_fields: userInfoFields.length > 0 ? userInfoFields : null
    });
    if (error) { toast.error("যোগ করা যায়নি: " + error.message); return; }
    toast.success("প্রোডাক্ট যোগ হয়েছে");
    resetForm(); setShowAdd(false);
    fetchProducts();
  };

  const handleEdit = async () => {
    if (!editProduct) return;
    const { error } = await supabase.from("products").update({
      name, 
      slug, 
      image_url: imageUrl || null, 
      category: categoryText, 
      category_id: categoryId || null,
      description, 
      is_voucher: isVoucher,
      user_info_fields: userInfoFields.length > 0 ? userInfoFields : null
    }).eq("id", editProduct.id);
    if (error) { toast.error("আপডেট ব্যর্থ: " + error.message); return; }
    toast.success("প্রোডাক্ট আপডেট হয়েছে");
    setEditProduct(null); resetForm();
    fetchProducts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("ডিলিট ব্যর্থ"); return; }
    toast.success("ডিলিট হয়েছে");
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setName(p.name); 
    setSlug(p.slug); 
    setImageUrl(p.image_url || "");
    setCategoryText(p.category || "FREE FIRE"); 
    setCategoryId(p.category_id || "");
    setDescription(p.description || ""); 
    setIsVoucher(p.is_voucher);
    setUserInfoFields(p.user_info_fields || []);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">প্রোডাক্ট ম্যানেজমেন্ট</h2>
          <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />নতুন প্রোডাক্ট</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>নতুন প্রোডাক্ট যোগ করুন</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input placeholder="প্রোডাক্টের নাম" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Input placeholder="স্লাগ (URL)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block mb-1">প্রোডাক্ট ইমেজ</label>
                  <ImageUpload folder="products" currentUrl={imageUrl} onUpload={setImageUrl} />
                  <Input placeholder="অথবা ইমেজ URL দিন" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block mb-1">ক্যাটাগরি সিলেক্ট করুন</label>
                  <Select value={categoryId} onValueChange={(val) => {
                    setCategoryId(val);
                    const cat = categories.find(c => c.id === val);
                    if (cat) setCategoryText(cat.name);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="ক্যাটাগরি বাছাই করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="প্রোডাক্ট ডেসক্রিপশন" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>
                <div className="flex items-center justify-between space-y-2">
                  <label className="text-sm font-medium text-foreground">ভাউচার প্রোডাক্ট</label>
                  <Switch checked={isVoucher} onCheckedChange={setIsVoucher} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">ব্যবহারকারীর তথ্য ফিল্ডসমূহ</label>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAddField(true)}
                      className="h-8"
                    >
                      + Add Field
                    </Button>
                  </div>
                            
                  {/* Predefined fields quick add */}
                  <div className="text-xs text-muted-foreground mb-2">Quick add:</div>
                  <div className="flex flex-wrap gap-2">
                    {predefinedFieldOptions.map(field => (
                      <Button
                        key={field.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={userInfoFields.some(f => f.id === field.id)}
                        onClick={() => {
                          setUserInfoFields([
                            ...userInfoFields,
                            {
                              id: field.id,
                              label: field.label,
                              placeholder: field.placeholder,
                              type: field.type,
                              required: true
                            }
                          ]);
                        }}
                        className="text-xs h-7"
                      >
                        + {field.label}
                      </Button>
                    ))}
                  </div>
                            
                  {/* Added fields display with scroll for many fields */}
                  {userInfoFields.length > 0 && (
                    <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                      {userInfoFields.map((field, index) => (
                        <div key={field.id || index} className="flex items-center justify-between p-2 border rounded bg-card">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="text-xs text-muted-foreground">
                              Type: {field.type || 'text'} | Placeholder: {field.placeholder || 'N/A'}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive h-8"
                            onClick={() => {
                              setUserInfoFields(userInfoFields.filter((_, i) => i !== index));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={handleAdd} className="w-full mt-4">যোগ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Add Custom Field Dialog */}
        <Dialog open={showAddField} onOpenChange={(o) => { setShowAddField(o); if (!o) { setNewFieldName(""); setNewFieldLabel(""); setNewFieldType("text"); setNewFieldPlaceholder(""); setNewFieldRequired(true); } }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Custom User Info Field</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block mb-1">Field ID (lowercase, no spaces)</label>
                <Input 
                  placeholder="e.g., game_uid, whatsapp" 
                  value={newFieldName} 
                  onChange={(e) => setNewFieldName(e.target.value.toLowerCase().replace(/\s+/g, '_'))} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block mb-1">Field Label (display name)</label>
                <Input 
                  placeholder="e.g., Game UID, WhatsApp Number" 
                  value={newFieldLabel} 
                  onChange={(e) => setNewFieldLabel(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block mb-1">Field Type</label>
                <Select value={newFieldType} onValueChange={(val: any) => setNewFieldType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="tel">Phone/Tel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block mb-1">Placeholder Text</label>
                <Input 
                  placeholder="e.g., Enter your UID" 
                  value={newFieldPlaceholder} 
                  onChange={(e) => setNewFieldPlaceholder(e.target.value)} 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={newFieldRequired} 
                  onCheckedChange={setNewFieldRequired} 
                />
                <label className="text-sm">Required field</label>
              </div>
              <Button 
                onClick={() => {
                  if (newFieldName && newFieldLabel) {
                    setUserInfoFields([
                      ...userInfoFields,
                      {
                        id: newFieldName,
                        label: newFieldLabel,
                        placeholder: newFieldPlaceholder,
                        type: newFieldType,
                        required: newFieldRequired
                      }
                    ]);
                    setShowAddField(false);
                    setNewFieldName("");
                    setNewFieldLabel("");
                    setNewFieldType("text");
                    setNewFieldPlaceholder("");
                    setNewFieldRequired(true);
                  } else {
                    toast.error("Field ID and Label are required");
                  }
                }} 
                className="w-full mt-2"
              >
                Add Field
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editProduct} onOpenChange={(o) => { if (!o) { setEditProduct(null); resetForm(); } }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>প্রোডাক্ট এডিট করুন</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input placeholder="প্রোডাক্টের নাম" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input placeholder="স্লাগ (URL)" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block mb-1">প্রোডাক্ট ইমেজ</label>
                <ImageUpload folder="products" currentUrl={imageUrl} onUpload={setImageUrl} />
                <Input placeholder="অথবা ইমেজ URL দিন" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block mb-1">ক্যাটাগরি সিলেক্ট করুন</label>
                <Select value={categoryId} onValueChange={(val) => {
                  setCategoryId(val);
                  const cat = categories.find(c => c.id === val);
                  if (cat) setCategoryText(cat.name);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="ক্যাটাগরি বাছাই করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Textarea placeholder="প্রোডাক্ট ডেসক্রিপশন" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
              <div className="flex items-center justify-between space-y-2">
                <label className="text-sm font-medium text-foreground">ভাউচার প্রোডাক্ট</label>
                <Switch checked={isVoucher} onCheckedChange={setIsVoucher} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">ব্যবহারকারীর তথ্য ফিল্ডসমূহ</label>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setShowAddField(true);
                    }}
                    className="h-8"
                  >
                    + Add Field
                  </Button>
                </div>
                
                {/* Predefined fields quick add */}
                <div className="text-xs text-muted-foreground mb-2">Quick add:</div>
                <div className="flex flex-wrap gap-2">
                  {predefinedFieldOptions.map(field => (
                    <Button
                      key={field.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={userInfoFields.some(f => f.id === field.id)}
                      onClick={() => {
                        setUserInfoFields([
                          ...userInfoFields,
                          {
                            id: field.id,
                            label: field.label,
                            placeholder: field.placeholder,
                            type: field.type,
                            required: true
                          }
                        ]);
                      }}
                      className="text-xs h-7"
                    >
                      + {field.label}
                    </Button>
                  ))}
                </div>
                
                {/* Added fields display with scroll for many fields */}
                {userInfoFields.length > 0 && (
                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                    {userInfoFields.map((field, index) => (
                      <div key={field.id || index} className="flex items-center justify-between p-2 border rounded bg-card">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{field.label}</div>
                          <div className="text-xs text-muted-foreground">
                            Type: {field.type || 'text'} | Placeholder: {field.placeholder || 'N/A'}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-8"
                          onClick={() => {
                            setUserInfoFields(userInfoFields.filter((_, i) => i !== index));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleEdit} className="w-full mt-4">আপডেট করুন</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইমেজ</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>স্লাগ</TableHead>
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.slug}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      কোনো প্রোডাক্ট নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
