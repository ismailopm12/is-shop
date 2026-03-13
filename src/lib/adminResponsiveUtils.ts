// 📱 Perfect Mobile Responsiveness Utility for Admin Panel
// Import and use these patterns across all admin pages

// ==================== RESPONSIVE CONTAINER PATTERNS ====================

export const container = {
  wrapper: "w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6",
  content: "w-full max-w-7xl mx-auto",
  section: "space-y-4 md:space-y-6",
};

// ==================== HEADER PATTERNS ====================

export const header = {
  base: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6",
  title: "text-xl md:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 truncate",
  subtitle: "text-sm md:text-base text-muted-foreground",
};

// ==================== GRID PATTERNS ====================

export const grid = {
  // Stats cards - adapts from 1 to 4 columns
  stats: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6",
  
  // Content cards - adapts from 1 to 3 columns
  content: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
  
  // Product grids - adapts from 2 to 6 columns
  products: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4",
  
  // Form fields - 1 or 2 columns
  form: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",
  
  // General purpose adaptive grid
  adaptive: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
};

// ==================== TABLE PATTERNS ====================

export const table = {
  // Responsive table wrapper with horizontal scroll
  wrapper: "overflow-x-auto -mx-4 md:mx-0 md:overflow-x-visible",
  inner: "min-w-[600px] md:min-w-full px-4 md:px-0",
  
  // Table container
  container: "w-full border rounded-lg overflow-hidden",
  
  // Card wrapper for table
  card: "rounded-lg shadow-sm md:shadow-md border bg-card",
};

// ==================== CARD PATTERNS ====================

export const card = {
  base: "rounded-lg md:rounded-xl shadow-sm md:shadow-md lg:shadow-lg border-border/40",
  header: "px-3 md:px-4 lg:px-6 py-3 md:py-4 border-b",
  content: "p-3 md:p-4 lg:p-6",
  footer: "px-3 md:px-6 py-3 border-t bg-muted/50",
};

// ==================== TEXT SIZE PATTERNS ====================

export const text = {
  xs: "text-xs md:text-sm lg:text-base",
  sm: "text-sm md:text-base lg:text-lg",
  base: "text-base md:text-lg lg:text-xl",
  lg: "text-lg md:text-xl lg:text-2xl",
  xl: "text-xl md:text-2xl lg:text-3xl",
  "2xl": "text-2xl md:text-3xl lg:text-4xl",
  
  heading: "text-xl md:text-2xl font-bold",
  subheading: "text-base md:text-lg font-semibold",
  label: "text-xs md:text-sm font-medium",
  caption: "text-xs md:text-sm text-muted-foreground",
};

// ==================== BUTTON PATTERNS ====================

export const button = {
  // Standard responsive button
  default: "h-9 md:h-10 min-h-[44px] px-3 md:px-4 text-sm md:text-base",
  
  // Small button
  sm: "h-8 md:h-9 min-h-[40px] px-2 md:px-3 text-xs md:text-sm",
  
  // Large button
  lg: "h-11 md:h-12 min-h-[48px] px-4 md:px-6 text-base md:text-lg",
  
  // Icon button (square)
  icon: "h-9 w-9 md:h-10 md:w-10 min-h-[44px] min-w-[44px]",
  
  // Icon only (small)
  iconSm: "h-8 w-8 md:h-9 md:w-9",
};

// ==================== INPUT PATTERNS ====================

export const input = {
  default: "h-9 md:h-10 min-h-[44px] text-sm md:text-base px-3 md:px-4",
  sm: "h-8 md:h-9 min-h-[40px] text-xs md:text-sm px-2 md:px-3",
  lg: "h-11 md:h-12 min-h-[48px] text-base md:text-lg px-4 md:px-6",
  textarea: "min-h-[80px] md:min-h-[100px] text-sm md:text-base p-3 md:p-4",
};

// ==================== BADGE PATTERNS ====================

export const badge = {
  default: "text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1",
  sm: "text-[10px] md:text-xs px-1.5 md:px-2 py-0.5",
  lg: "text-sm md:text-base px-3 md:px-4 py-1 md:py-1.5",
};

// ==================== SPACING UTILITIES ====================

export const spacing = {
  page: "p-3 md:p-6 lg:p-8",
  section: "py-4 md:py-6 lg:py-8",
  card: "p-3 md:p-4 lg:p-6",
  gap: "gap-3 md:gap-4 lg:gap-6",
  spaceY: "space-y-4 md:space-y-6 lg:space-y-8",
  spaceX: "space-x-3 md:space-x-4 lg:space-x-6",
};

// ==================== VISIBILITY UTILITIES ====================

export const visibility = {
  mobileOnly: "block md:hidden",
  tabletUp: "hidden md:block",
  desktopOnly: "hidden lg:block",
  hideMobile: "md:block",
  hideTablet: "md:hidden lg:block",
};

// ==================== LAYOUT COMPONENTS ====================

import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 ${className}`}>
      {children}
    </div>
  );
}

export function ResponsiveSection({ children, className = "" }: PageWrapperProps) {
  return (
    <section className={`space-y-4 md:space-y-6 ${className}`}>
      {children}
    </section>
  );
}

export function ResponsiveGrid({ 
  children, 
  cols = "adaptive",
  className = "" 
}: PageWrapperProps & { cols?: 'stats' | 'content' | 'products' | 'form' | 'adaptive' }) {
  return (
    <div className={`${grid[cols]} ${className}`}>
      {children}
    </div>
  );
}

// ==================== TABLE COMPONENT ====================

export function ResponsiveTable({ children }: { children: ReactNode }) {
  return (
    <div className={table.wrapper}>
      <div className={table.inner}>
        {children}
      </div>
    </div>
  );
}

// ==================== HOOKS ====================

export function useBreakpoint() {
  const getBreakpoint = () => {
    if (typeof window === 'undefined') return 'sm';
    const width = window.innerWidth;
    if (width >= 1536) return '2xl';
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    return 'sm';
  };

  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>(getBreakpoint());

  useEffect(() => {
    const handleResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// ==================== QUICK FIX EXAMPLES ====================

/*
BEFORE (Not responsive):
<div className="grid grid-cols-4 gap-4">
  <Card>...</Card>
</div>

AFTER (Perfectly responsive):
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
  <Card className={card.base}>...</Card>
</div>

---

BEFORE (Table overflows):
<Table>...</Table>

AFTER (Responsive table):
<div className="overflow-x-auto -mx-4 md:mx-0">
  <div className="min-w-[600px] px-4 md:px-0">
    <Table>...</Table>
  </div>
</div>

---

BEFORE (Fixed text size):
<h1 className="text-2xl font-bold">Title</h1>

AFTER (Responsive text):
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold px-3 md:px-0">Title</h1>

---

BEFORE (Small buttons):
<Button>Edit</Button>

AFTER (Touch-friendly):
<Button className="h-9 md:h-10 min-h-[44px] px-3 md:px-4">Edit</Button>
*/

// ==================== EXPORT ALL ====================

export default {
  container,
  header,
  grid,
  table,
  card,
  text,
  button,
  input,
  badge,
  spacing,
  visibility,
  PageWrapper,
  ResponsiveSection,
  ResponsiveGrid,
  ResponsiveTable,
  useBreakpoint,
  useIsMobile,
};

// Add this import at the top if using hooks
import { useState, useEffect } from "react";
