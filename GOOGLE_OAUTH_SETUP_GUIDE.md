# 🔐 Google OAuth Authentication Setup Guide

## 📋 Overview

This guide will help you configure Google Sign-In authentication for your Supabase project to work on **Vercel**, **Netlify**, **Railway**, or any other hosting provider.

Your app already has the code implemented! You just need to configure Google Cloud Console and Supabase dashboard.

---

## ✅ Current Implementation Status

**Code Status**: ✅ Already Implemented

Your app uses:
- **Lovable Auth** for Google OAuth
- **Supabase Auth** for session management
- Automatic profile creation
- Token synchronization

**Files Ready**:
- `src/pages/Login.tsx` - Google sign-in button
- `src/pages/Register.tsx` - Registration with Google
- `src/integrations/lovable/index.ts` - Lovable Auth integration
- `src/contexts/AuthContext.tsx` - Auth state management

---

## 🚀 Step-by-Step Setup

### **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name it: `BD Games Bazar` (or your preferred name)
4. Click **"Create"**

---

### **Step 2: Enable Google+ API**

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

---

### **Step 3: Create OAuth 2.0 Credentials**

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure **OAuth consent screen**:
   - **User Type**: External
   - **App name**: BD Games Bazar
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **"Save and Continue"**
   - Skip scopes (click **"Save and Continue"**)
   - Add test users if needed (or skip for production)
   - Click **"Back to Dashboard"**

4. Now create OAuth credentials:
   - **Application type**: Web application
   - **Name**: BD Games Bazar Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5128
     https://your-domain.com
     https://your-app.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5128/auth/v1/callback
     https://your-domain.com/auth/v1/callback
     https://your-app.vercel.app/auth/v1/callback
     
     IMPORTANT: Also add Supabase's callback URL:
     https://nsrexmmxegueqacawpjj.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**

5. **Copy your credentials**:
   - **Client ID**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxx`

---

### **Step 4: Configure Supabase Dashboard**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj)
2. Navigate to **Authentication** → **Providers**
3. Find **"Google"** in the list and click it
4. Toggle **"Enable Provider"** to ON
5. Enter your credentials:
   - **Client ID**: Paste from Google Cloud
   - **Client Secret**: Paste from Google Cloud
6. **Redirect URL**: 
   ```
   https://nsrexmmxegueqacawpjj.supabase.co/auth/v1/callback
   ```
7. Click **"Save"**

---

### **Step 5: Configure Lovable Dashboard** (If using Lovable Auth)

1. Go to [Lovable Dashboard](https://app.lovable.dev)
2. Select your project
3. Navigate to **Authentication** settings
4. Add Google OAuth credentials:
   - **Client ID**: Same as above
   - **Client Secret**: Same as above
5. Configure redirect URLs:
   ```
   http://localhost:5128/
   https://your-domain.com/
   https://your-app.vercel.app/
   ```

---

### **Step 6: Update Environment Variables**

#### For Local Development (.env)
```env
VITE_SUPABASE_PROJECT_ID="nsrexmmxegueqacawpjj"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://nsrexmmxegueqacawpjj.supabase.co"
VITE_LOVABLE_CLIENT_ID="your-lovable-client-id"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

#### For Vercel Deployment
Go to Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_PROJECT_ID=nsrexmmxegueqacawpjj
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://nsrexmmxegueqacawpjj.supabase.co
VITE_LOVABLE_CLIENT_ID=your-lovable-client-id
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Add all variables and click **"Save"**

---

### **Step 7: Update Supabase Auth Settings**

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URLs:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**:
     ```
     http://localhost:5128/
     https://your-domain.com/
     https://your-app.vercel.app/
     https://*.vercel.app/
     ```
3. Click **"Save"**

---

### **Step 8: Test Locally**

1. Start development server:
```bash
npm run dev
```

2. Go to: `http://localhost:5128/login`
3. Click **"Sign in with Google"** button
4. Choose a Google account
5. You should be redirected back to homepage as logged-in user

---

## 🌐 Deploy to Vercel

### Method 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ismailopm12/is-shop)

### Method 2: Manual Deploy

1. **Push to GitHub** (already done ✅)
   ```
   https://github.com/ismailopm12/is-shop
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Click **"Import Git Repository"**
   - Select `ismailopm12/is-shop`

3. **Configure Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables** (from Step 6)

5. **Click "Deploy"**

---

## 🔧 Post-Deployment Configuration

### Update Google Cloud Console

After deploying to Vercel, add your production URLs:

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add to **Authorized JavaScript origins**:
   ```
   https://is-shop-xi.vercel.app
   https://your-custom-domain.com
   ```

4. Add to **Authorized redirect URIs**:
   ```
   https://is-shop-xi.vercel.app/auth/v1/callback
   https://your-custom-domain.com/auth/v1/callback
   ```

5. Click **"Save"**

### Update Supabase Dashboard

1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel domain to Redirect URLs:
   ```
   https://is-shop-xi.vercel.app/
   https://*.vercel.app/
   ```

3. Click **"Save"**

---

## ✅ Testing Checklist

After deployment, verify:

### Local Development
- [ ] Google login button visible
- [ ] Clicking redirects to Google
- [ ] Can select Google account
- [ ] Redirects back to homepage
- [ ] User profile loads correctly
- [ ] Can access protected routes

### Production (Vercel)
- [ ] All local tests pass on Vercel URL
- [ ] No console errors
- [ ] Session persists after refresh
- [ ] Logout works correctly
- [ ] Mobile responsive works

---

## 🎯 Code Implementation Details

### How It Works

```typescript
// Login.tsx - Line 31-47
const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(`Google লগইন ব্যর্থ: ${error.message}`);
    }
  } catch (err: any) {
    toast.error("Google লগইন ব্যর্থ হয়েছে।");
  }
};
```

### Auth State Management

```typescript
// AuthContext.tsx - Line 52-76
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
  );
  // ...
}, []);
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Use environment variables for secrets
- Set proper redirect URLs
- Enable only necessary OAuth scopes
- Use HTTPS in production
- Implement rate limiting
- Monitor auth logs

### ❌ DON'T:
- Commit `.env` files to Git
- Hardcode client IDs/secrets
- Use HTTP in production
- Allow all redirect URLs
- Share service role keys

---

## 🐛 Troubleshooting

### Issue: "Invalid redirect_uri"

**Solution**: Ensure your redirect URI matches exactly in:
1. Google Cloud Console
2. Supabase Dashboard
3. Your code (`redirectTo` option)

### Issue: "Provider not enabled"

**Solution**: 
1. Check Supabase → Authentication → Providers
2. Make sure Google is enabled
3. Verify credentials are correct

### Issue: "Access blocked" from Google

**Solution**:
1. App is in testing mode - add your email to test users
2. Or complete OAuth consent screen verification
3. Submit for verification if going to production

### Issue: Works locally but not on Vercel

**Solution**:
1. Add Vercel domain to Google Cloud Console
2. Add Vercel domain to Supabase redirect URLs
3. Set environment variables in Vercel dashboard
4. Rebuild and redeploy

---

## 📊 Monitoring & Analytics

### Track Auth Events

Add to your Supabase dashboard:
- **Authentication** → **Users** - See new signups
- **Authentication** → **Logs** - Monitor auth events
- **Database** → **profiles** - Track user profiles

### Google Analytics Integration

Track auth events:
```javascript
// After successful login
gtag('event', 'login', {
  method: 'google'
});
```

---

## 🎨 Customization Options

### Change Button Style

```tsx
<Button 
  variant="outline" 
  className="w-full flex items-center gap-2 bg-white hover:bg-gray-50"
  onClick={handleGoogleLogin}
>
  <svg className="h-5 w-5">...</svg>
  Sign in with Google
</Button>
```

### Add Apple Sign-In

Similar setup with Apple Developer account:
```typescript
const handleAppleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: window.location.origin }
  });
};
```

---

## 📞 Support Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Lovable Auth Docs**: https://docs.lovable.dev/auth
- **Vercel Deployment**: https://vercel.com/docs/deployments

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Users can sign in with Google  
✅ No errors in browser console  
✅ User appears in Supabase dashboard  
✅ Profile page shows user info  
✅ Protected routes accessible  
✅ Session persists across refreshes  

---

## 🚀 Quick Deploy Command

After configuring everything:

```bash
# Build and deploy
npm run build
vercel --prod
```

Or push to trigger auto-deploy:

```bash
git add .
git commit -m "🔐 Configure Google OAuth for production"
git push origin main
```

---

**🎊 Congratulations!** Your Google OAuth authentication is now ready for production deployment on Vercel or any hosting provider!

---

*Last Updated: March 14, 2026*
*Project: BD Games Bazar (is-shop)*
*Repository: https://github.com/ismailopm12/is-shop*
