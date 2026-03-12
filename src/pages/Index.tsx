import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import HeroBanner from "@/components/HeroBanner";
import SocialButtons from "@/components/SocialButtons";
import ProductGrid from "@/components/ProductGrid";
import DigitalProductGrid from "@/components/DigitalProductGrid";
import SmmProductGrid from "@/components/SmmProductGrid";
import LiveOrderTicker from "@/components/LiveOrderTicker";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 pb-24">
        <AnnouncementBar />
        <HeroBanner />
        <SocialButtons />
        <ProductGrid />
        <DigitalProductGrid />
        <SmmProductGrid />
        <LiveOrderTicker />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
