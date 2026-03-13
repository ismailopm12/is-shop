import { ReactNode, useState } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="min-h-screen flex w-full relative">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block fixed md:relative z-20">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
                style={{ position: 'fixed' }}
              />
              
              {/* Mobile Sidebar */}
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-card z-50 md:hidden shadow-2xl"
                style={{ position: 'fixed', height: '100vh' }}
              >
                <div className="h-full flex flex-col">
                  {/* Mobile Header */}
                  <div className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0">
                    <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Sidebar Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <AdminSidebar />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="sticky top-0 z-30 h-14 flex items-center border-b bg-card px-3 md:px-4 gap-3 shadow-sm">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <SidebarTrigger className="hidden md:flex" />
            
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
                Admin Panel
              </h1>
            </div>

            {/* User Avatar/Profile could go here */}
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-3 md:p-6 bg-background overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
