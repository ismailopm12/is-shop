import { LayoutDashboard, Users, Package, ShoppingCart, ArrowLeft, Settings, Diamond, Ticket, Wallet, FileDown, Image, FileText, Smartphone, Coins, Globe, Megaphone, Database, Code, Link, MessageCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "ড্যাশবোর্ড", url: "/admin", icon: LayoutDashboard },
  { title: "ইউজার", url: "/admin/users", icon: Users },
  { title: "প্রোডাক্ট", url: "/admin/products", icon: Package },
  { title: "ক্যাটাগরি", url: "/admin/categories", icon: LayoutDashboard },
  { title: "প্যাকেজ", url: "/admin/packages", icon: Diamond },
  { title: "ভাউচার কোড", url: "/admin/vouchers", icon: Ticket },
  { title: "কয়েন", url: "/admin/coins", icon: Coins },
  { title: "ওয়ালেট", url: "/admin/wallet", icon: Wallet },
  { title: "অর্ডার", url: "/admin/orders", icon: ShoppingCart },
  { title: "ডিজিটাল ফাইল", url: "/admin/digital-products", icon: FileDown },
  { title: "হিরো ব্যানার", url: "/admin/hero-banners", icon: Image },
  { title: "SMM প্রোডাক্ট", url: "/admin/smm-products", icon: Smartphone },
  { title: "সোশ্যাল বাটন", url: "/admin/social-links", icon: Link },
  { title: "WhatsApp নোটিফিকেশন", url: "/admin/whatsapp-notifications", icon: MessageCircle },
  { title: "SEO", url: "/admin/seo", icon: Globe },
  { title: "পপআপ", url: "/admin/popups", icon: Megaphone },
  { title: "API সেটিংস", url: "/admin/api-settings", icon: Database },
  { title: "ডেভেলপার", url: "/admin/developers", icon: Code },
  { title: "পেজ কন্টেন্ট", url: "/admin/pages", icon: FileText },
  { title: "সেটিংস", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = () => {
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {!collapsed && "Admin Panel"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-accent/50"
                      activeClassName="bg-accent text-accent-foreground font-semibold"
                      onClick={handleNavClick}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => navigate("/")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {!collapsed && <span>সাইটে ফিরুন</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
