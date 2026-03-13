# 📱 WhatsApp Notification Setup with UltraMsg

## ✅ Complete Setup Guide for Order Notifications

---

## 📋 What You Need

From your **UltraMsg Dashboard**:
1. **Instance ID** (e.g., `instance12345`)
2. **Token** (e.g., `abc123xyz789`)
3. **API URL**: `https://api.ultramsg.com/{instance_id}/messages/chat`

---

## 🚀 Step-by-Step Setup

### Step 1: Add UltraMsg Credentials to Edge Function

Go to your project folder and open:
```
supabase/functions/.env
```

Add your UltraMsg credentials at the end:

```env
# UltraMsg WhatsApp API
ULTRAMSG_INSTANCE_ID="your_instance_id_here"
ULTRAMSG_TOKEN="your_token_here"
```

**Example** (replace with your actual values):
```env
ULTRAMSG_INSTANCE_ID="instance12345"
ULTRAMSG_TOKEN="abc123xyz789"
```

---

### Step 2: Update Admin Settings via UI

1. **Login to Admin Panel**
2. Go to: **Admin → WhatsApp Notifications**
3. Fill in the form:

**API Configuration:**
- **API Provider**: Select `Ultramsg` from dropdown
- **Instance ID**: Your UltraMsg instance ID
- **API Token**: Your UltraMsg token

**Notification Settings:**
- **Enable WhatsApp**: Toggle ON ✅
- **Send to User**: Toggle ON ✅ (user gets order confirmation)
- **Send to Admin**: Toggle ON ✅ (you get new order alerts)

**Phone Numbers:**
- **Admin Number**: Your WhatsApp number (with country code, e.g., `+8801712345678`)
- **Sender Number**: Optional (can be same as admin)

**Message Templates:**

*User Template* (what customer receives):
```
✅ অর্ডার কনফার্মেশন!

আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।

অর্ডার ID: {order_id}
পরিমাণ: ৳{amount}
সময়: {date}

ধন্যবাদ!
```

*Admin Template* (what you receive):
```
🔔 নতুন অর্ডার!

গ্রাহক: {customer_name}
অর্ডার ID: {order_id}
পরিমাণ: ৳{amount}
সময়: {date}
```

4. Click **"Save Settings"**

---

### Step 3: Test the Integration

In the same WhatsApp Notifications page:

1. Scroll to **"Test Configuration"** section
2. Enter a test phone number (e.g., your own number)
   - Format: `+8801712345678` (with country code)
3. Click **"Send Test Message"**
4. Check your WhatsApp for the test message

✅ **Success**: You'll receive: "🧪 টেস্ট মেসেজ - এটি একটি টেস্ট WhatsApp নোটিফিকেশন"

---

## 🔧 How It Works

### Order Flow:

1. **Customer places order** on website
2. **System automatically**:
   - Saves order to database
   - Triggers WhatsApp notification function
   - Sends messages via UltraMsg API

3. **Two messages sent**:
   - **To Customer**: Order confirmation with details
   - **To Admin**: New order alert

---

## 📊 Database Structure

The system uses this table:

```sql
whatsapp_settings {
  id: UUID
  api_provider: TEXT (e.g., "ultramsg")
  instance_id: TEXT
  api_token: TEXT
  admin_number: TEXT (+880...)
  sender_number: TEXT
  is_enabled: BOOLEAN
  send_to_user: BOOLEAN
  send_to_admin: BOOLEAN
  message_template_user: TEXT
  message_template_admin: TEXT
}
```

---

## 🎯 Edge Function Integration

The Supabase Edge Function (`send-whatsapp`) handles API calls:

**Location**: `supabase/functions/send-whatsapp/index.ts`

**What it does**:
1. Receives phone number and message
2. Calls UltraMsg API with your credentials
3. Returns success/error status

**API Call**:
```typescript
POST https://api.ultramsg.com/{instance_id}/messages/chat
Content-Type: application/x-www-form-urlencoded

token=YOUR_TOKEN&to=+8801712345678&body=Message%20text
```

---

## ✅ Testing Checklist

Before going live, verify:

- [ ] UltraMsg account is active
- [ ] Instance ID and Token are correct
- [ ] Instance is connected (check UltraMsg dashboard)
- [ ] Admin number is in correct format (+880...)
- [ ] Test message received successfully
- [ ] Both user and admin toggles are ON
- [ ] Message templates look good

---

## 🐛 Troubleshooting

### Issue: "Instance not found" error

**Solution**: 
- Check Instance ID is correct
- Verify instance exists in UltraMsg dashboard
- Make sure instance is active/connected

### Issue: "Invalid token" error

**Solution**:
- Copy token exactly from UltraMsg dashboard
- No extra spaces before/after
- Case-sensitive (copy-paste carefully)

### Issue: Messages not sending

**Solutions**:
1. Check UltraMsg instance has credit/balance
2. Verify phone numbers include country code (+880...)
3. Check instance is online in UltraMsg dashboard
4. Test API manually using curl or Postman

### Issue: Receiving error in admin panel

**Check**:
- Edge Function is deployed: `supabase functions deploy send-whatsapp`
- RLS policies allow function execution
- Network connection is stable

---

## 📱 Manual API Test

You can test your UltraMsg integration manually:

**Using cURL**:
```bash
curl -X POST "https://api.ultramsg.com/YOUR_INSTANCE_ID/messages/chat" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=YOUR_TOKEN" \
  -d "to=+8801712345678" \
  -d "body=Test message from UltraMsg"
```

**Expected Response**:
```json
{
  "success": true,
  "sent": true,
  "message_id": "msg_abc123"
}
```

---

## 🎨 Customization Options

### Change Message Templates

In admin panel, edit the templates:

**Variables available**:
- `{order_id}` - Order ID
- `{amount}` - Total amount
- `{customer_name}` - Customer name
- `{date}` - Order date/time
- `{product_name}` - Product name (if single product)

**Example with emojis**:
```
🎉 অর্ডার সফল! 

✅ অর্ডার ID: {order_id}
💰 পরিমাণ: ৳{amount}
⏰ সময়: {date}

খুব শীঘ্রই আপনার অর্ডার প্রসেস করা হবে।
```

### Disable Specific Notifications

- Turn off "Send to User" if you don't want customer confirmations
- Turn off "Send to Admin" if you only want user notifications
- Keep both ON for complete notification system

---

## 🔒 Security Best Practices

1. **Never expose credentials in frontend code**
   - Store in `.env` file (server-side only)
   - Use Edge Function as proxy

2. **Use RLS policies**
   - Only admins can modify WhatsApp settings
   - Edge Function validates requests

3. **Rate limiting**
   - Don't send too many messages quickly
   - UltraMsg may have rate limits

4. **Monitor usage**
   - Check UltraMsg dashboard for message count
   - Watch for unusual activity

---

## 💡 Pro Tips

1. **Keep messages short** - Long messages may be split
2. **Use clear formatting** - Emojis and line breaks help readability
3. **Test before launch** - Always test with real phone numbers
4. **Save templates** - Keep backup of your message templates
5. **Monitor delivery** - Check UltraMsg dashboard for delivery status
6. **Update admin number** - Keep your number current

---

## 📞 UltraMsg Resources

**Official Documentation**: https://ultramsg.com/docs  
**Dashboard**: https://ultramsg.com/dashboard  
**API Reference**: https://ultramsg.com/api  

---

## 🎯 Quick Reference

| Setting | Location | Example |
|---------|----------|---------|
| **Instance ID** | UltraMsg Dashboard → Instances | `instance12345` |
| **Token** | UltraMsg Dashboard → Settings | `abc123xyz789` |
| **API URL** | Fixed | `https://api.ultramsg.com/{id}/messages/chat` |
| **Admin Number** | Admin Panel → WhatsApp Settings | `+8801712345678` |
| **Edge Function** | Supabase Project | `send-whatsapp` |

---

## ✅ Final Checklist

After setup completion:

- [ ] `.env` file updated with UltraMsg credentials
- [ ] Admin panel settings saved
- [ ] Test message sent successfully
- [ ] Real order test completed
- [ ] Both user and admin notifications working
- [ ] Message templates finalized
- [ ] Monitoring system in place

---

## 🚀 Deployment

If using Vercel/Supabase hosting:

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy send-whatsapp
   ```

2. **Set environment variables** in Supabase Dashboard:
   - Go to: Settings → Edge Functions
   - Add `ULTRAMSG_INSTANCE_ID` and `ULTRAMSG_TOKEN`

3. **Restart deployment** if needed

---

## 📊 Expected Results

When everything works:

✅ **Customer Experience**:
- Places order → Gets instant WhatsApp confirmation
- Can see order details in WhatsApp
- Feels confident about order

✅ **Admin Experience**:
- Gets instant notification for new orders
- Can respond quickly
- Tracks all orders via WhatsApp

✅ **Business Benefits**:
- Better customer communication
- Reduced support queries
- Increased trust and transparency
- Professional service appearance

---

## 🆘 Support

If you need help:

1. **Check UltraMsg dashboard** - Instance status and logs
2. **Review edge function logs** - Supabase Dashboard → Functions
3. **Test with different numbers** - Rule out number format issues
4. **Verify credentials** - Double-check Instance ID and Token

---

**Created**: March 14, 2026  
**Status**: ✅ Ready to Configure  
**Integration**: UltraMsg WhatsApp API  
**Estimated Setup Time**: 5-10 minutes
