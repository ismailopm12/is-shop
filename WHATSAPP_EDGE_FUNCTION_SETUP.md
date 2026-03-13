# 🚀 WhatsApp Edge Function Setup Guide

## ⚠️ Important: Fix for `http_post` Error

The error `function http_post(text, jsonb) does not exist` occurs because Supabase doesn't have built-in HTTP functions. We use **Edge Functions** instead!

---

## 📋 Setup Steps

### Step 1: Install Supabase CLI (if not installed)

```bash
npm install -g supabase
# or
bun install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open browser for authentication.

### Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in Supabase dashboard URL:
`https://app.supabase.com/project/YOUR_PROJECT_REF`

### Step 4: Deploy Edge Function

```bash
cd supabase/functions/send-whatsapp
supabase functions deploy send-whatsapp
```

### Step 5: Update Database with Your URL

After deployment, update the SQL migration file:

1. Get your function URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-whatsapp
   ```

2. Run this in Supabase SQL Editor:
   ```sql
   UPDATE public.whatsapp_settings 
   SET api_provider = 'ultramsg_edge_function';
   ```

3. The trigger will now use the edge function automatically!

---

## 🔧 Alternative: Simpler Approach (No Edge Function)

If you don't want to use Edge Functions, here's a simpler alternative:

### Option A: Use Webhook Service

1. Go to `/admin/whatsapp-notifications`
2. Enable notifications but understand they'll be logged only
3. Use a webhook service like:
   - **Zapier** - Connect Supabase to WhatsApp
   - **Make.com** - Automate WhatsApp messages
   - **n8n.io** - Self-hosted automation

### Option B: Manual Testing Only

For testing purposes, the system will log messages without actually sending them until you configure the edge function.

---

## 🎯 How It Works Now

### Current Flow (After Fix):
```
Order Placed → Trigger Fires → Logs Message Attempt
```

### Full Flow (After Edge Function Setup):
```
Order Placed → Trigger Fires → Calls Edge Function → Sends to Ultramsg API → User & Admin get WhatsApp
```

---

## 📝 Testing Without Edge Function

You can still test the admin panel:

1. Go to `/admin/whatsapp-notifications`
2. Fill in settings (Instance ID, Token, Number)
3. Click "টেস্ট মেসেজ পাঠান"
4. You'll see: "Message logged for sending"
5. Check Supabase logs to see the attempt

---

## 🔍 View Logs in Supabase

To see message attempts:

1. Go to Supabase Dashboard
2. Database → Logs
3. Look for: `WhatsApp message attempt to +880...`

---

## ✅ Recommended Setup

For production use, I recommend:

### Method 1: Edge Function (Best)
✅ Real-time sending  
✅ No external services needed  
✅ Full control  
✅ Cost: Free (Supabase free tier)  

### Method 2: Zapier Integration (Easiest)
✅ No coding required  
✅ Easy setup  
✅ Works immediately  
✅ Cost: $20/month (Zapier)  

### Method 3: Direct API Call from Frontend (Quick Test)
✅ Immediate testing  
✅ No backend needed  
⚠️ Less secure (exposes API keys)  

---

## 🛠️ Quick Fix Commands

If you want to disable WhatsApp temporarily:

```sql
UPDATE public.whatsapp_settings 
SET is_enabled = false;
```

To re-enable later:

```sql
UPDATE public.whatsapp_settings 
SET is_enabled = true;
```

---

## 📞 Need Help?

Common issues:

### Issue: "supabase command not found"
**Solution:** Install globally
```bash
npm install -g supabase
```

### Issue: "Project not linked"
**Solution:** Link project
```bash
supabase link --project-ref YOUR_REF
```

### Issue: "Function deployment failed"
**Solution:** Check Deno version
```bash
deno --version
# Should be 1.28.0 or higher
```

---

## 🎉 What's Fixed

✅ Removed dependency on non-existent `http_post` function  
✅ Added Edge Function support  
✅ Graceful fallback logging  
✅ Ready for full implementation  

**Next step:** Deploy the edge function or choose an alternative method! 🚀
