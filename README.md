# 🎮 BD Games Bazar - Professional Gaming & Digital Products Platform

A modern, full-featured e-commerce platform for gaming top-ups, digital products, vouchers, and SMM services. Built with React, TypeScript, Vite, and Supabase.

![BD Games Bazar Banner](public/banner.jpg)

## ✨ Features

### 🛍️ **E-commerce**
- **Gaming Top-ups**: Free Fire diamonds and other game currencies
- **Digital Products**: Instant delivery digital goods
- **Voucher System**: Discount codes and promotional vouchers
- **SMM Services**: Social media marketing services
- **Coin System**: In-platform currency for seamless transactions

### 💳 **Payment Integration**
- Uddoktapay payment gateway
- Multiple payment methods
- Secure transaction processing
- Real-time payment verification
- WhatsApp notifications

### 👤 **User Features**
- User authentication (Login/Register)
- Profile management with avatars
- Order history tracking
- Wallet system with coin support
- Real-time order status updates

### 🔐 **Admin Panel**
- Complete dashboard analytics
- Product management (Diamond packages, Digital products, SMM)
- Order management with live status
- User management
- Category management
- Voucher code generation
- SEO management tools
- Hero banner customization
- Popup management
- Developer & API settings
- WhatsApp notification system

### 🎯 **SEO & Marketing**
- Professional SEO management
- Open Graph social media integration
- Google Analytics support
- Schema.org markup
- Meta tags optimization
- Search result previews

### 📱 **Live Features**
- **Live Order Status Ticker**: Real-time order updates with orange theme
- Live order notifications
- Recent activity feed
- User presence indicators

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS + CSS Modules
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Uddoktapay API key (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/bd-games-bazar.git
cd bd-games-bazar
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_CREATE_PAYMENT_FUNCTION_URL="https://your-project.supabase.co/functions/v1/create-payment"
VITE_VERIFY_PAYMENT_FUNCTION_URL="https://your-project.supabase.co/functions/v1/verify-payment"
```

4. **Set up Supabase backend**

Navigate to Supabase SQL Editor and run the migrations in order:
```bash
supabase/migrations/*.sql
```

5. **Deploy Edge Functions**

Install Supabase CLI and deploy functions:
```bash
# Install Supabase CLI (Windows)
winget install Supabase.SupabaseCLI

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy
```

6. **Start development server**
```bash
npm run dev
```

Your app will be available at `http://localhost:5128`

## 🏗️ Project Structure

```
bd-games-bazar/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/           # Admin panel components
│   │   ├── ui/              # Base UI components
│   │   ├── Header.tsx
│   │   ├── LiveOrderTicker.tsx    # 🟠 NEW: Orange-themed live orders
│   │   └── ...
│   ├── pages/               # Application pages
│   │   ├── admin/           # Admin pages
│   │   │   ├── AdminSeo.tsx       # 🆕 Professional SEO management
│   │   │   └── ...
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   ├── integrations/        # Third-party integrations
│   │   └── supabase/        # Supabase client & types
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React context providers
│   ├── lib/                 # Utility libraries
│   └── assets/              # Static assets
├── supabase/
│   ├── functions/           # Supabase Edge Functions
│   │   ├── create-payment/  # Payment creation
│   │   ├── verify-payment/  # Payment verification
│   │   └── send-whatsapp/   # WhatsApp notifications
│   └── migrations/          # Database migrations
└── public/                  # Public static files
```

## 🎨 Recent Updates

### 🟠 **Live Order Status - Orange Theme** (Latest)
- Enhanced live order ticker with professional orange color scheme
- Real-time order status updates
- Beautiful gradient borders and animations
- Improved visibility and user engagement

### 🆕 **Professional SEO Management** (Latest)
- Advanced SEO configuration panel
- Real-time search result previews
- Social media preview (Facebook/LinkedIn)
- Analytics integration (Google Analytics, Tag Manager, Facebook Pixel)
- Character count for titles and descriptions
- SEO health score dashboard
- Professional tips and recommendations

## 📊 Database Schema

Key tables:
- `profiles` - User profiles with avatars
- `products` - Main products table
- `product_variants` - Product variants with pricing
- `diamond_packages` - Free Fire diamond packages
- `digital_products` - Digital product catalog
- `smm_products` - SMM service packages
- `orders` - Order management
- `voucher_codes` - Discount voucher system
- `categories` - Product categorization
- `seo_settings` - SEO configuration
- `hero_banners` - Homepage banners
- `popups` - Promotional popups
- `developers` - API developer management

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

## 🌐 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm run preview
```

## 🔐 Security Features

- JWT-based authentication
- Row-level security (RLS) policies
- Environment variable protection
- Input validation with Zod
- XSS protection headers
- CSRF protection

## 📱 Mobile Responsive

Fully responsive design optimized for:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## 🎯 Key Features Documentation

### Live Order Ticker
Located in `src/components/LiveOrderTicker.tsx`
- Shows real-time orders with orange theme
- Updates every 30 seconds
- Displays: user info, product, package, status, price
- Fully customizable styling

### SEO Management
Located in `src/pages/admin/AdminSeo.tsx`
- Basic SEO metadata
- Open Graph social media tags
- Advanced technical SEO
- Site verification codes
- Analytics tracking integration
- Live previews for Google and social media

### Coin System
In-platform currency for seamless transactions:
- Wallet top-ups
- Coin-based purchases
- Automatic coin assignment
- Refund support

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support and questions:
- Email: support@bdgamesbazar.com
- Discord: [Join our Discord](link)
- Telegram: [Join our Telegram](link)

## 🙏 Acknowledgments

- Supabase team for the amazing backend platform
- Vercel for hosting and deployment
- shadcn/ui for beautiful UI components
- Radix UI for accessible primitives
- Tailwind CSS for the utility-first framework

## 📈 Roadmap

- [ ] Multi-language support (Bengali + English)
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Affiliate program
- [ ] Reward points system
- [ ] Mobile app (React Native)
- [ ] Dark mode enhancement

---

**Made with ❤️ by the BD Games Bazar Team**

*Last Updated: March 14, 2026*
