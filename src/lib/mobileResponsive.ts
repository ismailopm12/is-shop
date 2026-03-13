// 📱 Perfect Mobile Responsiveness - Admin Panel
// Import this utility or copy patterns to make ANY admin page responsive

export const mobileResponsive = {
  // Full width container - NO max-width限制
  container: "w-full mx-auto px-3 md:px-6 lg:px-8",
  
  // Main content area - no padding waste on mobile
  main: "flex-1 p-0 md:p-4 lg:p-6 bg-background w-full overflow-x-hidden",
  
  // Responsive headings - scale with screen
  heading: {
    xl: "text-2xl md:text-3xl lg:text-4xl font-bold",
    lg: "text-xl md:text-2xl lg:text-3xl font-semibold",
    md: "text-lg md:text-xl lg:text-2xl font-semibold",
  },
  
  // Grid layouts - adaptive columns
  grid: {
    stats: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full",
    content: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full",
    cards: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full",
  },
  
  // Card styling - full width, proper padding
  card: {
    base: "rounded-lg shadow-sm border w-full",
    header: "px-4 md:px-6 py-4 md:py-6 border-b",
    content: "p-4 md:p-6",
  },
  
  // Table wrapper - horizontal scroll on mobile
  table: {
    wrapper: "overflow-x-auto -mx-1 md:-mx-6",
    inner: "min-w-[800px] px-4 md:px-6 pb-4",
  },
  
  // Touch-friendly sizes
  touch: {
    button: "h-10 md:h-11 min-h-[44px]",
    input: "h-10 md:h-11 min-h-[44px]",
    icon: "h-5 w-5 md:h-6 md:w-6",
  },
  
  // Spacing utilities
  spacing: {
    section: "space-y-6 md:space-y-8 w-full",
    gap: "gap-4 md:gap-6",
  },
};

// Quick usage example:
/*
<div className={mobileResponsive.container}>
  <h1 className={mobileResponsive.heading.xl}>Title</h1>
  
  <div className={mobileResponsive.grid.stats}>
    {/* Stats cards */}
  </div>
  
  <Card className={mobileResponsive.card.base}>
    <CardHeader className={mobileResponsive.card.header}>
      {/* Header content */}
    </CardHeader>
    <CardContent className={mobileResponsive.card.content}>
      {/* Card content */}
    </CardContent>
  </Card>
</div>
*/
