import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminCheck } from "@/hooks/useAdminCheck";

// Inner component to control sidebar state
function AdminContent({ children }: { children: ReactNode }) {
  // Debug log to see if children are actually being passed
  useEffect(() => {
    console.log("=== ADMIN CONTENT DEBUG ===");
    console.log("Children received:", children);
    console.log("Children type:", typeof children);
    console.log("Children is valid:", !!children);
  }, [children]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-[60] h-[56px] md:h-[60px] flex items-center border-b bg-card px-3 md:px-4 lg:px-6 gap-3 shadow-sm flex-shrink-0 w-full">
        <SidebarTrigger className="h-10 w-10 md:h-11 md:w-11 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg lg:text-xl font-bold text-foreground truncate leading-tight">
            Admin Panel
          </h1>
        </div>
      </header>

      {/* Main Content Area - Direct rendering with visible background */}
      <main className="flex-1 w-full bg-gray-50 overflow-auto">
        <div className="w-full min-h-screen p-4 md:p-6 lg:p-8">
          {/* Content Container - Visible white card */}
          <div className="bg-white rounded-lg shadow-sm border p-6 max-w-7xl mx-auto">
            {/* Children content renders here */}
            {children}
          </div>
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

  // Debug: Log what children are being passed
  console.log("=== ADMIN LAYOUT CHILDREN ===");
  console.log("Children:", children);
  console.log("Has children:", !!children);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - Responsive on all screen sizes */}
        <div className="flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Content Area - MUST BE FLEX-1 TO GROW */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminContent>
            {children}
          </AdminContent>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
