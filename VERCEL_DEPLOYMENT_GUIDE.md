# 🚀 Vercel Deployment Guide - Sweet Build Wizard

## ✅ Complete Setup Instructions

### Step 1: Configure Supabase for Google Sign-In

**Before deploying to Vercel, you MUST configure Google OAuth in Supabase:**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj/auth/providers

2. **Enable Google Provider:**
   - Click "Google" provider
   - Toggle "Enable Sign in with Google"
   - Add your **Google Cloud Console credentials**:
     - Client ID
     - Client Secret

3. **Get Google OAuth Credentials:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Authorized redirect URIs:
     ```
     https://nsrexmmxegueqacawpjj.supabase.co/auth/v1/callback
     https://your-vercel-domain.vercel.app/auth/v1/callback
     ```
   - Copy Client ID and Client Secret
   - Paste into Supabase dashboard

4. **Save Changes**

---

### Step 2: Prepare for Vercel Deployment

#### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd c:\Users\mdism\Downloads\sweet-build-wizard-main\sweet-build-wizard-main

# Deploy to production
vercel --prod
```

#### Option B: Deploy via GitHub Integration

1. **Push code to GitHub** (Already done! ✅)
   - Repository: https://github.com/ismailopm12/is-shop

2. **Connect to Vercel:**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select `is-shop` repository
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```
   VITE_SUPABASE_PROJECT_ID=nsrexmmxegueqacawpjj
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcmV4bW14ZWd1ZXFhY2F3cGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTUyODUsImV4cCI6MjA4ODgzMTI4NX0.5z25zMJcXW-cEu2_8rHHAP1BtXuPoTu65gy52giZYQc
   VITE_SUPABASE_URL=https://nsrexmmxegueqacawpjj.supabase.co
   VITE_CREATE_PAYMENT_FUNCTION_URL=https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/create-payment
   VITE_VERIFY_PAYMENT_FUNCTION_URL=https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/verify-payment
   ```

5. **Click "Deploy"**

---

### Step 3: Post-Deployment Configuration

#### Update Supabase Redirect URLs

After Vercel gives you a domain (e.g., `https://is-shop.vercel.app`):

1. **Go to Supabase Dashboard:**
   - Authentication → URL Configuration

2. **Add Site URL:**
   ```
   https://is-shop.vercel.app
   ```

3. **Add Redirect URLs:**
   ```
   https://is-shop.vercel.app
   https://is-shop.vercel.app/auth/callback
   https://is-shop.vercel.app/payment-callback
   ```

4. **Update Google OAuth Redirect URIs:**
   In Google Cloud Console, add:
   ```
   https://is-shop.vercel.app/auth/v1/callback
   ```

---

### Step 4: Test All Pages

After deployment, test these critical pages:

#### ✅ Public Pages
- [ ] Homepage: `/`
- [ ] Login: `/login` (Test Google Sign-In!)
- [ ] Register: `/register` (Test Google Sign-In!)
- [ ] Products: `/products`
- [ ] Product Detail: `/products/:slug`
- [ ] SMM Products: `/smm-products`
- [ ] Digital Products: `/digital-products`
- [ ] Contact Us: `/contact-us`
- [ ] FAQ: `/faq`
- [ ] Privacy Policy: `/privacy-policy`
- [ ] Terms of Service: `/terms-of-service`

#### ✅ User Pages (Require Login)
- [ ] Profile: `/profile`
- [ ] My Orders: `/orders`
- [ ] My Codes: `/codes`
- [ ] Downloads: `/downloads`
- [ ] Add Money: `/add-money`
- [ ] Payment Callback: `/payment-callback`

#### ✅ Admin Pages (Require Admin Role)
- [ ] Admin Dashboard: `/admin/dashboard`
- [ ] Admin Users: `/admin/users`
- [ ] Admin Products: `/admin/products`
- [ ] Admin Orders: `/admin/orders`
- [ ] Admin Packages: `/admin/packages`
- [ ] Admin Voucher Codes: `/admin/voucher-codes`
- [ ] Admin Digital Products: `/admin/digital-products`
- [ ] Admin SMM Products: `/admin/smm-products`
- [ ] Admin Wallet: `/admin/wallet`
- [ ] Admin Coins: `/admin/coins`
- [ ] Admin Site Settings: `/admin/site-settings`
- [ ] Admin SEO: `/admin/seo`
- [ ] Admin Popups: `/admin/popups`
- [ ] Admin Hero Banners: `/admin/hero-banners`
- [ ] Admin Pages: `/admin/pages`
- [ ] Admin Categories: `/admin/categories`

---

### Step 5: Test Critical Functionality

#### 💳 Payment Gateway Testing
1. **Coin Payment:**
   - Select variant → Pay with coins → Verify instant voucher delivery
   - Check "My Codes" section immediately after payment

2. **Wallet Payment:**
   - Select variant → Pay with wallet → Verify voucher code appears

3. **UddoktaPay (Instant Pay):**
   - Select variant → Instant Pay → Complete payment
   - Verify redirect to callback page
   - Check voucher code displayed
   - Verify "My Codes" section updated

#### 🔐 Authentication Testing
1. **Email/Password Login:**
   - Register with email/password
   - Login successfully
   - Logout

2. **Google Sign-In:**
   - Click "Sign in with Google"
   - Complete Google OAuth flow
   - Verify redirect back to site
   - Check user is logged in

#### 👤 Admin Functionality Testing
1. **Login as Admin:**
   - Use admin account
   - Access `/admin/dashboard`

2. **Create Product:**
   - Add new product
   - Add variants with reward coins
   - Set product as voucher (if applicable)

3. **Add Voucher Codes:**
   - Go to Admin → Voucher Codes
   - Bulk add codes
   - Link to product variant
   - Verify dropdown shows variants

4. **Manage Orders:**
   - View all orders
   - Change order status
   - Verify real-time updates

5. **Site Settings:**
   - Update site configuration
   - Test SEO settings
   - Configure promotional popups

---

### Step 6: Custom Domain (Optional)

If you want to use a custom domain:

1. **In Vercel Dashboard:**
   - Go to project settings
   - Click "Domains"
   - Add your domain (e.g., `sweetbuildwizard.com`)

2. **Configure DNS:**
   - Add CNAME record pointing to `cname.vercel.com`
   - Or add A record pointing to `76.76.21.21`

3. **Update Supabase:**
   - Add custom domain to allowed redirect URLs
   - Update Google OAuth redirect URIs

---

## 🔧 Troubleshooting

### Issue 1: Google Sign-In Shows 404

**Symptoms:** Clicking "Sign in with Google" shows 404 error

**Solution:**
1. Verify Google OAuth is enabled in Supabase dashboard
2. Check Google Cloud Console has correct redirect URIs
3. Ensure Supabase project ID matches in .env
4. Wait 5-10 minutes after enabling Google provider (propagation delay)

**Debug:**
```javascript
// In browser console on /login page
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin }
});
console.log({ data, error });
```

---

### Issue 2: Payment Not Working After Deployment

**Symptoms:** UddoktaPay payment fails or doesn't redirect

**Solution:**
1. Verify edge function URLs are accessible:
   - https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/create-payment
   - https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/verify-payment

2. Test functions directly using curl or Postman

3. Check Supabase logs for errors

---

### Issue 3: Admin Pages Show 404

**Symptoms:** Can't access `/admin/*` routes

**Solution:**
1. Verify user has `is_admin = true` in profiles table
2. Check RLS policies allow admin access
3. Clear browser cache and hard refresh

**SQL to check admin status:**
```sql
SELECT email, is_admin FROM auth.users u
JOIN public.profiles p ON u.id = p.user_id
WHERE email = 'your-email@example.com';
```

---

### Issue 4: Vercel Build Fails

**Symptoms:** Deployment fails during build

**Common Fixes:**

1. **TypeScript Errors:**
   ```bash
   # Check for TS errors locally
   npm run build
   ```

2. **Missing Dependencies:**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Memory Issues:**
   - In Vercel dashboard, increase build memory
   - Or split large components

---

## 📊 Success Checklist

Before going live, verify:

- [ ] ✅ All pages load without 404 errors
- [ ] ✅ Google Sign-In works on login/register pages
- [ ] ✅ All 3 payment methods work (coin, wallet, UddoktaPay)
- [ ] ✅ Voucher codes delivered instantly after payment
- [ ] ✅ Admin can access all admin pages
- [ ] ✅ Admin can create/edit/delete products
- [ ] ✅ Admin can manage voucher codes
- [ ] ✅ Admin can view/manage orders
- [ ] ✅ Real-time order ticker working
- [ ] ✅ SEO settings visible to users
- [ ] ✅ Promotional popups displaying
- [ ] ✅ Mobile responsive design working
- [ ] ✅ Bottom navigation functional
- [ ] ✅ Header/nav links working
- [ ] ✅ Footer links functional

---

## 🎯 Quick Deploy Commands

```bash
# 1. Make sure you're in project directory
cd c:\Users\mdism\Downloads\sweet-build-wizard-main\sweet-build-wizard-main

# 2. Commit any changes
git add .
git commit -m "Fix Google Sign-In and prepare for Vercel deployment"
git push origin main

# 3. Deploy to Vercel
vercel --prod

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N (first time)
# - Project name? is-shop
# - Directory? ./
# - Override settings? N
```

---

## 🔗 Important Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com
- **Your Repository:** https://github.com/ismailopm12/is-shop

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Vercel Logs:**
   - Vercel Dashboard → Deployments → Click latest → View Logs

2. **Check Supabase Logs:**
   - Supabase Dashboard → Edge Functions → Logs

3. **Browser Console:**
   - Press F12 → Console tab
   - Look for errors

4. **Share Error Details:**
   - Screenshot of error
   - Browser console logs
   - Vercel deployment logs

---

**Last Updated:** March 12, 2026  
**Status:** Ready to Deploy ✅  
**Estimated Time:** 15-20 minutes for full setup
