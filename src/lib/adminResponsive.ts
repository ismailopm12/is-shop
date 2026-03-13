// 📱 Mobile Responsive Utility Classes for Admin Panel
// Import this file or copy the patterns to make any admin page responsive

// ==================== RESPONSIVE TABLE PATTERNS ====================

// Pattern 1: Horizontal Scroll Table (Best for mobile)
/*
<div className="overflow-x-auto -mx-4 md:mx-0">
  <Table className="min-w-[600px] md:min-w-full">
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</div>
*/

// Pattern 2: Card Grid for Mobile, Table for Desktop
/*
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
*/

// ==================== RESPONSIVE CONTAINER ====================

export const containerClasses = "w-full max-w-7xl mx-auto px-3 md:px-6";

// ==================== RESPONSIVE HEADER ====================

export const headerClasses = `
  flex flex-col sm:flex-row sm:items-center sm:justify-between 
  gap-3 mb-4 md:mb-6
`;

export const titleClasses = `
  text-xl md:text-2xl lg:text-3xl font-bold 
  text-foreground flex items-center gap-2
  truncate
`;

// ==================== RESPONSIVE GRID ====================

export const gridClasses = {
  // Stats cards
  stats: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6",
  
  // Product grids
  products: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4",
  
  // Form fields
  form: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",
  
  // General content
  content: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
};

// ==================== RESPONSIVE SPACING ====================

export const spacing = {
  section: "space-y-4 md:space-y-6 lg:space-y-8",
  card: "p-3 md:p-4 lg:p-6",
  page: "p-3 md:p-6 lg:p-8",
  gap: "gap-3 md:gap-4 lg:gap-6",
};

// ==================== RESPONSIVE TEXT ====================

export const textSizes = {
  xs: "text-xs md:text-sm",
  sm: "text-sm md:text-base",
  base: "text-base md:text-lg",
  lg: "text-lg md:text-xl",
  xl: "text-xl md:text-2xl",
  "2xl": "text-2xl md:text-3xl",
};

// ==================== RESPONSIVE BUTTONS ====================

export const buttonClasses = {
  default: "h-9 md:h-10 min-h-[44px] px-3 md:px-4",
  sm: "h-8 md:h-9 min-h-[40px] px-2 md:px-3",
  lg: "h-11 md:h-12 min-h-[48px] px-4 md:px-6",
  icon: "h-9 w-9 md:h-10 md:w-10 min-h-[44px] min-w-[44px]",
};

// ==================== RESPONSIVE CARD ====================

export const cardClasses = `
  shadow-sm md:shadow-md lg:shadow-lg
  rounded-lg md:rounded-xl
  border-border/40
`;

// ==================== RESPONSIVE INPUT ====================

export const inputClasses = `
  h-9 md:h-10 min-h-[44px]
  text-sm md:text-base
  px-3 md:px-4
`;

// ==================== RESPONSIVE BADGE ====================

export const badgeClasses = {
  default: "text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1",
  sm: "text-[10px] md:text-xs px-1.5 md:px-2 py-0.5",
  lg: "text-sm md:text-base px-3 md:px-4 py-1 md:py-1.5",
};

// ==================== COMPONENT WRAPPERS ====================

// Mobile-first wrapper with horizontal padding
export const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
    {children}
  </div>
);

// Responsive section wrapper
export const Section = ({ children }: { children: React.ReactNode }) => (
  <section className="space-y-4 md:space-y-6">
    {children}
  </section>
);

// Responsive table wrapper with horizontal scroll
export const ResponsiveTable = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto -mx-4 md:mx-0 md:overflow-x-visible">
    <div className="min-w-[600px] md:min-w-full px-4 md:px-0">
      {children}
    </div>
  </div>
);

// Mobile card, desktop table/list
export const MobileCardDesktopList = ({ 
  mobileChildren, 
  desktopChildren 
}: { 
  mobileChildren: React.ReactNode;
  desktopChildren: React.ReactNode;
}) => (
  <>
    <div className="md:hidden">{mobileChildren}</div>
    <div className="hidden md:block">{desktopChildren}</div>
  </>
);

// ==================== HOOKS ====================

import { useEffect, useState } from 'react';

// Detect if mobile
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// Get current breakpoint
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('sm');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

// ==================== QUICK FIX EXAMPLES ====================

/*
// Example 1: Make existing table responsive
BEFORE:
<Table>...</Table>

AFTER:
<div className="overflow-x-auto -mx-4">
  <div className="min-w-[600px] px-4">
    <Table>...</Table>
  </div>
</div>

// Example 2: Responsive header
BEFORE:
<h1 className="text-2xl font-bold">Title</h1>

AFTER:
<h1 className="text-xl md:text-2xl font-bold px-3 md:px-0">Title</h1>

// Example 3: Responsive grid
BEFORE:
<div className="grid grid-cols-4 gap-4">...</div>

AFTER:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">...</div>

// Example 4: Responsive buttons
BEFORE:
<Button>Edit</Button>

AFTER:
<Button className="h-9 md:h-10 min-h-[44px]">Edit</Button>

// Example 5: Responsive badges
BEFORE:
<Badge>Active</Badge>

AFTER:
<Badge className="text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1">Active</Badge>
*/

// ==================== EXPORT ALL ====================

export default {
  containerClasses,
  headerClasses,
  titleClasses,
  gridClasses,
  spacing,
  textSizes,
  buttonClasses,
  cardClasses,
  inputClasses,
  badgeClasses,
  PageWrapper,
  Section,
  ResponsiveTable,
  MobileCardDesktopList,
  useIsMobile,
  useBreakpoint,
};
