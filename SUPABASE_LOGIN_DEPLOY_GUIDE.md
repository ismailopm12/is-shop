# 🔐 Supabase Login & Deployment Guide

## 📌 Current Project Configuration

Your project is already set up with:
- **Project ID**: `nsrexmmxegueqacawpjj`
- **Supabase URL**: https://nsrexmmxegueqacawpjj.supabase.co
- **Edge Functions**: create-payment, verify-payment, send-whatsapp

---

## 🚀 Step 1: Install Supabase CLI

### Option A: Using Winget (Recommended for Windows)
```powershell
winget install Supabase.SupabaseCLI
```

### Option B: Using Chocolatey
```powershell
choco install supabase-cli
```

### Option C: Using Scoop
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option D: Manual Installation
1. Download from: https://github.com/supabase/cli/releases
2. Extract to a folder (e.g., `C:\Program Files\Supabase`)
3. Add to PATH environment variable

---

## 🔑 Step 2: Login to Supabase

### 1. Login Command
```bash
supabase login
```

This will:
- Open your browser
- Ask you to log in to https://supabase.com
- Redirect back to complete authentication

### 2. Verify Login
```bash
supabase whoami
```

You should see your account email.

---

## 🔗 Step 3: Link Your Project

### Link to Existing Project
```bash
supabase link --project-ref nsrexmmxegueqacawpjj
```

### Verify Link
```bash
supabase status
```

You should see:
- Project ID: `nsrexmmxegueqacawpjj`
- API URLs and other details

---

## 📦 Step 4: Deploy Edge Functions

Your project has 3 edge functions:
- `create-payment` - Handles payment creation
- `verify-payment` - Verifies payment status
- `send-whatsapp` - Sends WhatsApp notifications

### Deploy All Functions
```bash
supabase functions deploy
```

### Deploy Individual Function
```bash
# Deploy create-payment function
supabase functions deploy create-payment

# Deploy verify-payment function
supabase functions deploy verify-payment

# Deploy send-whatsapp function
supabase functions deploy send-whatsapp
```

### Set Function Secrets (Environment Variables)
```bash
# Navigate to supabase/functions directory
cd supabase/functions

# Set secrets for each function
supabase secrets set --env-file .env
```

Or set individually:
```bash
supabase secrets set SUPABASE_URL="https://nsrexmmxegueqacawpjj.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set UDDOKTAPAY_API_KEY="VDEUkEE1ByktFymDc4TfSsy6CPUs3SOyCZFxhvIZ"
```

---

## 🧪 Step 5: Test Edge Functions Locally (Optional)

### Start Local Supabase (if needed)
```bash
supabase start
```

### Serve Functions Locally
```bash
supabase functions serve
```

Access at: `http://localhost:54321/functions/v1/{function-name}`

---

## 🔧 Step 6: Update Environment Variables

### Frontend (.env file)
Your `.env` file should have:

```env
VITE_SUPABASE_PROJECT_ID="nsrexmmxegueqacawpjj"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://nsrexmmxegueqacawpjj.supabase.co"
VITE_CREATE_PAYMENT_FUNCTION_URL="https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/create-payment"
VITE_VERIFY_PAYMENT_FUNCTION_URL="https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/verify-payment"
```

### Edge Functions (supabase/functions/.env)
```env
SUPABASE_URL="https://nsrexmmxegueqacawpjj.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
UDDOKTAPAY_API_KEY="VDEUkEE1ByktFymDc4TfSsy6CPUs3SOyCZFxhvIZ"
```

⚠️ **IMPORTANT**: Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key from Supabase dashboard.

---

## 📊 Step 7: Get Your Service Role Key

1. Go to https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj
2. Click **Settings** (left sidebar)
3. Click **API**
4. Copy the **service_role** key (NOT the anon/public key)
5. Update your `supabase/functions/.env` file

---

## ✅ Step 8: Verify Deployment

### Check Functions Status
```bash
supabase functions list
```

### Test Functions
Use curl or Postman to test:

```bash
# Test create-payment function
curl -X POST "https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/create-payment" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🔍 Common Issues & Solutions

### Issue: "Not logged in"
**Solution**: Run `supabase login` again

### Issue: "Project not linked"
**Solution**: Run `supabase link --project-ref nsrexmmxegueqacawpjj`

### Issue: "Function deployment failed"
**Solution**: 
1. Check your internet connection
2. Verify secrets are set correctly
3. Check function logs: `supabase functions logs {function-name}`

### Issue: "Permission denied"
**Solution**: Make sure you're using the service_role key for server-side operations

---

## 📱 WhatsApp Function Setup

For the `send-whatsapp` function to work:

1. **Get WhatsApp API Credentials**:
   - Sign up at https://whatsapp.com/business
   - Or use a provider like Twilio, MessageBird, etc.

2. **Update Function Secrets**:
```bash
supabase secrets set WHATSAPP_API_URL="your-whatsapp-api-url"
supabase secrets set WHATSAPP_API_KEY="your-whatsapp-api-key"
```

3. **Test the Function**:
```bash
supabase functions invoke send-whatsapp \
  --body '{"phone": "+1234567890", "message": "Test message"}'
```

---

## 🎯 Quick Reference Commands

```bash
# Authentication
supabase login
supabase whoami
supabase logout

# Project Management
supabase link --project-ref nsrexmmxegueqacawpjj
supabase status
supabase projects list

# Functions
supabase functions deploy
supabase functions delete {function-name}
supabase functions logs {function-name}
supabase functions invoke {function-name}
supabase secrets set KEY=value
supabase secrets list

# Local Development
supabase start
supabase stop
supabase status
supabase functions serve
```

---

## 📞 Support Links

- Supabase Docs: https://supabase.com/docs
- Edge Functions Docs: https://supabase.com/docs/guides/functions
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/cli/issues

---

## ✨ Next Steps

1. ✅ Install Supabase CLI
2. ✅ Login: `supabase login`
3. ✅ Link project: `supabase link --project-ref nsrexmmxegueqacawpjj`
4. ✅ Deploy functions: `supabase functions deploy`
5. ✅ Set secrets: `supabase secrets set --env-file .env`
6. ✅ Test your functions
7. ✅ Update frontend .env with correct keys

---

**Need help?** Check the Supabase dashboard at:
https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj
