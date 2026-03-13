import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminCheck } from "@/hooks/useAdminCheck";

// Inner component to control sidebar state
function AdminContent({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Header - Always visible with trigger */}
      <header className="sticky top-0 z-50 h-14 flex items-center border-b bg-card px-4 gap-3 shadow-sm flex-shrink-0">
        {/* Sidebar Trigger - Shows hamburger on mobile, regular trigger on desktop */}
        <SidebarTrigger className="h-9 w-9" />
        
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
            Admin Panel
          </h1>
        </div>
      </header>

      {/* Main Content Area - Full width, proper padding */}
      <main className="flex-1 p-3 md:p-6 lg:p-8 bg-background overflow-x-hidden w-full">
        <div className="w-full max-w-[1920px] mx-auto">
          {children}
        </div>
      </main>
    </>
  );
}

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { isAdmin, loading } = useAdminCheck();

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
        {/* Sidebar - Responsive on all screen sizes */}
        <AdminSidebar />

        {/* Content Area */}
        <AdminContent>
          {children}
        </AdminContent>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
