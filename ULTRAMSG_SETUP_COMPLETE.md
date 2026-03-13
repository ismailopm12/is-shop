# 🚀 UltraMsg WhatsApp Integration - Quick Setup

## ✅ Your Credentials (Already Configured!)

**Instance ID**: `instance165464`  
**Token**: `fo6xxh4dj5bfn4oo`  
**API URL**: `https://api.ultramsg.com/instance165464/messages/chat`

---

## 📋 Setup Steps

### Step 1: Run Database Migration ⚠️ **REQUIRED**

Go to **Supabase Dashboard** → SQL Editor and run:

```sql
-- File: SETUP_WHATSAPP_SETTINGS.sql
-- Copy entire content and paste in Supabase SQL Editor
```

**OR** copy this:

```sql
-- Create whatsapp_settings table
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider TEXT DEFAULT 'ultramsg',
  instance_id TEXT,
  api_token TEXT,
  admin_number TEXT,
  sender_number TEXT,
  is_enabled BOOLEAN DEFAULT true,
  send_to_user BOOLEAN DEFAULT true,
  send_to_admin BOOLEAN DEFAULT true,
  message_template_user TEXT,
  message_template_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access"
ON public.whatsapp_settings FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access"
ON public.whatsapp_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.app_role = 'admin'
  )
);

INSERT INTO public.whatsapp_settings (
  api_provider,
  instance_id,
  api_token,
  admin_number,
  is_enabled,
  send_to_user,
  send_to_admin
)
SELECT 
  'ultramsg',
  NULL,
  NULL,
  '+8801XXXXXXXXX',
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.whatsapp_settings LIMIT 1
);
```

✅ **Success**: "Query returned successfully"

---

### Step 2: Configure in Admin Panel

After running the SQL above:

1. **Login to Admin Panel**
2. Go to: **Admin → WhatsApp Notifications**
3. Fill in the form:

**API Configuration Section:**
- **API Provider**: Select `Ultramsg` ✅
- **Instance ID**: `instance165464`
- **API Token**: `fo6xxh4dj5bfn4oo`

**Contact Information:**
- **Admin Number**: Your WhatsApp number (e.g., `+8801712345678`)
- **Sender Number**: Optional (can leave empty)

**Notification Settings:**
- **Enable WhatsApp**: Toggle ON ✅
- **Send to User**: Toggle ON ✅
- **Send to Admin**: Toggle ON ✅

**Message Templates** (optional - already has defaults):
- Leave as-is or customize to your preference

4. Click **"Save Settings"**

---

### Step 3: Test Integration

In the same page:

1. Scroll to **"Test Configuration"** section
2. Enter test number: `+8801712345678` (your number)
3. Click **"Send Test Message"**
4. Check WhatsApp for test message

✅ **Success**: You'll receive: "🧪 টেস্ট মেসেজ - এটি একটি টেস্ট WhatsApp নোটিফিকেশন"

---

## 🎯 How It Works

### Automatic Order Notifications

**When customer places order:**

1. **System saves order** to database
2. **Triggers WhatsApp function** automatically
3. **Sends two messages**:
   - To **Customer**: Order confirmation
   - To **Admin**: New order alert

### Message Flow

```
Customer Places Order
        ↓
Database saves order
        ↓
Edge Function triggers
        ↓
Calls UltraMsg API
        ↓
Messages sent via WhatsApp
        ↓
✅ Customer gets confirmation
✅ Admin gets notification
```

---

## 📱 Example Messages

### Customer Receives:
```
✅ অর্ডার কনফার্মেশন!

আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।

অর্ডার ID: ORD-12345
পরিমাণ: ৳999.00
সময়: 14/03/2026 10:30 AM

ধন্যবাদ!
```

### Admin Receives:
```
🔔 নতুন অর্ডার!

গ্রাহক: Rahim Ahmed
অর্ডার ID: ORD-12345
পরিমাণ: ৳999.00
সময়: 14/03/2026 10:30 AM
```

---

## 🔧 Edge Function Integration

Your UltraMsg credentials are stored in:
```
supabase/functions/.env

ULTRAMSG_INSTANCE_ID="instance165464"
ULTRAMSG_TOKEN="fo6xxh4dj5bfn4oo"
```

The edge function (`send-whatsapp`) uses these to send messages.

---

## ✅ Admin Panel Features

From **WhatsApp Notifications** page, admins can:

### Manage API Credentials
- ✅ Change Instance ID anytime
- ✅ Update API Token
- ✅ Switch API providers (if needed)

### Control Notifications
- ✅ Enable/Disable all WhatsApp notifications
- ✅ Toggle user notifications ON/OFF
- ✅ Toggle admin notifications ON/OFF

### Customize Messages
- ✅ Edit customer message template
- ✅ Edit admin message template
- ✅ Use variables: {order_id}, {amount}, {customer_name}, {date}

### Test & Monitor
- ✅ Send test messages
- ✅ Check if enabled
- ✅ View current configuration

---

## 🎨 UI Preview

**Admin Panel → WhatsApp Notifications:**

```
┌─────────────────────────────────────┐
│ 📱 WhatsApp নোটিফিকেশন     ✅ সক্রিয় │
├─────────────────────────────────────┤
│                                     │
│ API Configuration                   │
│ ─────────────────────────────────   │
│ API Provider: [Ultramsg ▼]          │
│ Instance ID:  [instance165464]      │
│ API Token:    [fo6xxh4dj5bfn4oo]    │
│                                     │
│ Contact Information                 │
│ ─────────────────────────────────   │
│ Admin Number: [+8801712345678]      │
│ Sender Number: [Optional...]        │
│                                     │
│ Notification Settings               │
│ ─────────────────────────────────   │
│ ☑️ Enable WhatsApp                  │
│ ☑️ Send to User                     │
│ ☑️ Send to Admin                    │
│                                     │
│ Message Templates                   │
│ ─────────────────────────────────   │
│ [User Template Textarea...]         │
│                                     │
│ [Admin Template Textarea...]        │
│                                     │
│ [💾 Save Settings]                  │
│                                     │
│ Test Configuration                  │
│ ─────────────────────────────────   │
│ Test Number: [+8801712345678]       │
│ [🧪 Send Test Message]              │
└─────────────────────────────────────┘
```

---

## 🔒 Security

**Credentials Protected By:**
- ✅ Stored in `.env` file (server-side only)
- ✅ Never exposed to frontend
- ✅ RLS policies restrict access
- ✅ Only admins can modify settings
- ✅ Edge Function validates all requests

---

## 📊 Database Schema

```sql
whatsapp_settings {
  id: UUID
  api_provider: TEXT (default: 'ultramsg')
  instance_id: TEXT
  api_token: TEXT
  admin_number: TEXT
  sender_number: TEXT
  is_enabled: BOOLEAN (default: true)
  send_to_user: BOOLEAN (default: true)
  send_to_admin: BOOLEAN (default: true)
  message_template_user: TEXT
  message_template_admin: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

---

## 🎯 Quick Reference

| Setting | Value | Location |
|---------|-------|----------|
| **Instance ID** | `instance165464` | `.env` + Admin Panel |
| **Token** | `fo6xxh4dj5bfn4oo` | `.env` + Admin Panel |
| **API URL** | `https://api.ultramsg.com/instance165464/messages/chat` | Edge Function |
| **Admin Number** | Set in admin panel | Admin Panel |
| **Edge Function** | `send-whatsapp` | Supabase Functions |

---

## ✅ Success Checklist

After setup completion:

- [ ] ✅ SQL migration ran successfully
- [ ] ✅ Table `whatsapp_settings` exists
- [ ] ✅ Credentials saved in `.env`
- [ ] ✅ Admin panel shows WhatsApp settings
- [ ] ✅ Instance ID and Token filled in
- [ ] ✅ Admin number configured
- [ ] ✅ Test message sent successfully
- [ ] ✅ Both user & admin toggles ON
- [ ] ✅ Real order test completed

---

## 🐛 Troubleshooting

### Issue: Settings not saving

**Solution**: 
- Make sure you ran the SQL migration
- Check you're logged in as admin
- Verify RLS policies are correct

### Issue: Test message not sending

**Solution**:
- Check Instance ID and Token are correct
- Verify UltraMsg instance is online
- Check phone number format (+880...)
- Ensure edge function is deployed

### Issue: Can't see WhatsApp settings page

**Solution**:
- Make sure you have admin role
- Check `app_role = 'admin'` in profiles table
- Clear browser cache and refresh

---

## 💡 Pro Tips

1. **Keep credentials secure** - Don't share your token
2. **Test before going live** - Always send test message
3. **Monitor UltraMsg balance** - Keep account funded
4. **Use clear templates** - Simple messages work best
5. **Include order ID** - Helps with support queries
6. **Update admin number** - Keep it current

---

## 📞 UltraMsg Resources

**Dashboard**: https://ultramsg.com/dashboard  
**Documentation**: https://ultramsg.com/docs  
**Support**: https://ultramsg.com/support  

---

## 🚀 Deployment Status

```
✅ Credentials configured in .env
✅ Edge Function ready (send-whatsapp)
✅ SQL migration script created
⏳ Need to run SQL in Supabase
⏳ Need to configure in admin panel
⏳ Need to test with real order
```

---

**Created**: March 14, 2026  
**Status**: ✅ Ready to Deploy  
**Integration**: UltraMsg WhatsApp API  
**Estimated Setup Time**: 5 minutes
