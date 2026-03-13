import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Inner component to control sidebar state
function AdminContent({ children, mobileMenuOpen, setMobileMenuOpen }: { 
  children: ReactNode; 
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  const { openMobile, setOpenMobile } = useSidebar();

  // Sync our state with sidebar's internal state
  useEffect(() => {
    if (mobileMenuOpen && !openMobile) {
      setOpenMobile(true);
    }
  }, [mobileMenuOpen, openMobile, setOpenMobile]);

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 h-14 flex items-center border-b bg-card px-3 md:px-4 gap-3 shadow-sm">
        {/* Mobile Menu Button - TRIGGERS SIDEBAR */}
        <SidebarTrigger className="md:hidden" />
        
        {/* Desktop Sidebar Trigger */}
        <SidebarTrigger className="hidden md:flex" />
        
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
            Admin Panel
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-x-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-2 md:px-4">
          {children}
        </div>
      </main>
    </>
  );
}

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { isAdmin, loading } = useAdminCheck();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar - Fixed position */}
        <div className="hidden md:block sticky top-0 h-screen">
          <AdminSidebar />
        </div>

        {/* Mobile & Desktop Content */}
        <AdminContent 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
        >
          {children}
        </AdminContent>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
