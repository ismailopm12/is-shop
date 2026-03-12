import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import AddMoney from "./pages/AddMoney";
import MyOrders from "./pages/MyOrders";
import MyCodes from "./pages/MyCodes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminVoucherCodes from "./pages/admin/AdminVoucherCodes";
import AdminWallet from "./pages/admin/AdminWallet";
import AdminDigitalProducts from "./pages/admin/AdminDigitalProducts";
import AdminHeroBanners from "./pages/admin/AdminHeroBanners";
import AdminPages from "./pages/admin/AdminPages";
import PaymentCallback from "./pages/PaymentCallback";
import DigitalProducts from "./pages/DigitalProducts";
import DigitalProductDetail from "./pages/DigitalProductDetail";
import Downloads from "./pages/Downloads";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQ from "./pages/FAQ";
import TermsOfService from "./pages/TermsOfService";
import SmmProducts from "./pages/SmmProducts";
import SmmProductDetail from "./pages/SmmProductDetail";
import AdminSmmProducts from "./pages/admin/AdminSmmProducts";
import AdminCoins from "./pages/admin/AdminCoins";
import AdminSeo from "./pages/admin/AdminSeo";
import AdminPopups from "./pages/admin/AdminPopups";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SiteSettingsProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/add-money" element={<AddMoney />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/codes" element={<MyCodes />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/digital" element={<DigitalProducts />} />
              <Route path="/digital/:id" element={<DigitalProductDetail />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/smm" element={<SmmProducts />} />
              <Route path="/smm/:id" element={<SmmProductDetail />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/settings" element={<AdminSiteSettings />} />
              <Route path="/admin/packages" element={<AdminPackages />} />
              <Route path="/admin/vouchers" element={<AdminVoucherCodes />} />
              <Route path="/admin/wallet" element={<AdminWallet />} />
              <Route path="/admin/digital-products" element={<AdminDigitalProducts />} />
              <Route path="/admin/hero-banners" element={<AdminHeroBanners />} />
              <Route path="/admin/pages" element={<AdminPages />} />
              <Route path="/admin/smm-products" element={<AdminSmmProducts />} />
              <Route path="/admin/coins" element={<AdminCoins />} />
              <Route path="/admin/seo" element={<AdminSeo />} />
              <Route path="/admin/popups" element={<AdminPopups />} />
              <Route path="/payment-callback" element={<PaymentCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SiteSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
