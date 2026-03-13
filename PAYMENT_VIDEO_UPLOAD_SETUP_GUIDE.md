# 🎥 Payment Method Video Upload - Setup Guide

## ✨ New Feature Added!

Admins can now **directly upload instructional videos** for payment methods (bKash, Nagad, Rocket, etc.) from the Wallet management page.

---

## 📋 What You Can Do Now

1. **Upload Videos Directly** - Drag & drop or select video files (max 50MB)
2. **Add Video Details** - Title, description, status
3. **Manage Videos** - Edit, delete, reorder
4. **Toggle Visibility** - Activate/deactivate videos
5. **Use External URLs** - Paste YouTube or other video links

---

## 🚀 Setup Steps

### Step 1: Run Database Migration ⚠️ **IMPORTANT**

Go to **Supabase Dashboard** → SQL Editor and run:

```sql
-- File: ADD_PAYMENT_VIDEO_UPLOAD.sql
-- Copy entire contents and paste in Supabase SQL Editor
```

**OR** copy this SQL and run it:

```sql
-- Create table for payment method videos
CREATE TABLE IF NOT EXISTS public.payment_method_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_mb NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_method_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
ON public.payment_method_videos FOR SELECT
USING (true);

-- Allow admin full access
CREATE POLICY "Allow admin full access"
ON public.payment_method_videos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_payment_videos_sort 
ON public.payment_method_videos(sort_order, created_at DESC);

-- Insert sample data
INSERT INTO public.payment_method_videos (title, description, video_url, is_active, sort_order)
VALUES 
  (
    'বিকাশে টাকা জমা দেওয়ার নিয়ম',
    'কিভাবে বিকাশ ব্যবহার করে আপনার ওয়ালেটে টাকা যোগ করবেন',
    '',
    true,
    1
  ),
  (
    'নগদে টাকা জমা দেওয়ার নিয়ম',
    'কিভাবে নগদ ব্যবহার করে আপনার ওয়ালেটে টাকা যোগ করবেন',
    '',
    true,
    2
  ),
  (
    'রকেট থেকে টাকা জমা দেওয়ার নিয়ম',
    'কিভাবে রকেট ব্যবহার করে দ্রুত টাকা যোগ করবেন',
    '',
    true,
    3
  );

-- Create function to get active videos
CREATE OR REPLACE FUNCTION public.get_payment_videos()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.title,
    v.description,
    v.video_url,
    v.thumbnail_url,
    v.duration_seconds,
    v.sort_order
  FROM public.payment_method_videos v
  WHERE v.is_active = true
  ORDER BY v.sort_order ASC, v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

✅ **Success**: You should see "Query returned successfully"

---

### Step 2: Create Storage Bucket

Go to **Supabase Dashboard** → Storage → Create new bucket

**Bucket Details**:
- **Name**: `payment-videos`
- **Public**: ✅ Yes (make it public)
- **File size limit**: `52428800` bytes (50MB)
- **Allowed MIME types**: 
  - `video/mp4`
  - `video/webm`
  - `video/avi`

**Storage Policy** (add this policy to the bucket):

```sql
-- Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-videos');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-videos' 
  AND auth.role() = 'authenticated'
);

-- Allow admins to delete
CREATE POLICY "Allow admin delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-videos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

✅ **Success**: Bucket created and policies added

---

### Step 3: Test the Feature

1. **Wait 30 seconds** for Vercel deployment
2. **Refresh** your site (Ctrl+Shift+R)
3. **Go to**: Admin Panel → Wallet Management
4. **Scroll down** to "Payment Method Videos" section
5. **Click** "Add New Video" button
6. **Try uploading** a test video

---

## 🎯 How to Use

### Add New Video

1. Go to **Admin Panel** → **Wallet**
2. Find **"Payment Method Videos"** card
3. Click **"নতুন ভিডিও যোগ করুন"** (Add New Video)
4. Fill in the form:
   - **Title**: Video name (e.g., "বিকাশে টাকা জমা দেওয়ার নিয়ম")
   - **Description**: Brief details (optional)
   - **Video Link**: Either:
     - Upload file (click "ফাইল সিলেক্ট করুন")
     - OR paste external URL (YouTube, Vimeo, etc.)
   - **Active**: Check to make visible on website
5. Click **"যোগ করুন"** (Add)

### Upload Video File

1. In the upload dialog, click **"ফাইল সিলেক্ট করুন"**
2. Choose video file from your computer
3. Wait for upload to complete (progress shown)
4. Video URL auto-fills when complete
5. Add title and description
6. Click save

**Supported Formats**: MP4, WebM, AVI  
**Max Size**: 50MB

### Edit Existing Video

1. Find video in the table
2. Click **Edit** button (pencil icon)
3. Make changes
4. Click **"আপডেট করুন"** (Update)

### Delete Video

1. Find video in the table
2. Click **Delete** button (trash icon)
3. Confirm deletion
4. Video removed permanently

### Reorder Videos

Videos display in order of their `sort_order` value:
- Lower numbers appear first
- Auto-assigned when creating (1, 2, 3...)
- To reorder: Edit video → Change sort_order → Save

---

## 📊 Features Overview

### Table Columns

| Column | Description |
|--------|-------------|
| **শিরোনাম** | Video title with icon |
| **বিবরণ** | Short description (truncated) |
| **স্ট্যাটাস** | Active (green) / Inactive (gray) |
| **ক্রম** | Sort order number |
| **অ্যাকশন** | Edit & Delete buttons |

### Upload Dialog Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| **Title** | Text input | ✅ Yes | Bengali or English |
| **Description** | Textarea | ❌ No | Max 500 characters |
| **Video Link** | URL input | ✅ Yes | Auto-filled on upload |
| **Upload File** | File picker | ❌ No | Alternative to URL |
| **Active** | Checkbox | ❌ No | Default: checked |

### Validation Rules

- ✅ Title required (min 3 characters)
- ✅ Video URL required (or uploaded file)
- ✅ File size max 50MB
- ✅ Only video formats allowed
- ✅ Must be authenticated admin

---

## 🎨 UI Screenshots Description

### Main Wallet Page
- New card after User Wallets table
- Purple "Video" icon
- "Add New Video" button (top right)
- Table showing all videos

### Upload Dialog
- Large file drop zone
- Upload progress indicator
- Success message with URL preview
- Form fields for title/description
- Active toggle checkbox
- Cancel & Save buttons

### Success States
- Green checkmark on upload
- Toast notification
- Video appears in table immediately

---

## 🔧 Technical Details

### Database Schema

```sql
payment_method_videos {
  id: UUID (primary key)
  title: TEXT (not null)
  description: TEXT
  video_url: TEXT (not null)
  thumbnail_url: TEXT
  duration_seconds: INTEGER
  file_size_mb: NUMERIC(10,2)
  is_active: BOOLEAN (default true)
  sort_order: INTEGER (default 0)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Storage Structure

```
Bucket: payment-videos
├── 1710234567890-abc123.mp4
├── 1710234567891-def456.webm
└── 1710234567892-ghi789.avi
```

**Filename Format**: `{timestamp}-{random}.{ext}`  
**Access**: Public via CDN URL

### API Functions

```typescript
// Get all active videos
const { data } = await supabase
  .from("payment_method_videos")
  .select("*")
  .eq("is_active", true)
  .order("sort_order");

// Upload video file
const { data } = await supabase.storage
  .from('payment-videos')
  .upload(fileName, file);

// Get public URL
const { publicUrl } = supabase.storage
  .from('payment-videos')
  .getPublicUrl(fileName);
```

---

## ✅ Testing Checklist

Before deploying to production:

### Database
- [ ] Ran SQL migration script
- [ ] Verified table exists
- [ ] Checked RLS policies
- [ ] Tested get_payment_videos() function

### Storage
- [ ] Created `payment-videos` bucket
- [ ] Set bucket to public
- [ ] Added storage policies
- [ ] Set 50MB file size limit

### Frontend
- [ ] Admin panel loads without errors
- [ ] "Payment Method Videos" section visible
- [ ] "Add New Video" button works
- [ ] Upload dialog opens
- [ ] File upload works (test with small file)
- [ ] External URL works
- [ ] Form validation works
- [ ] Success/error toasts appear
- [ ] Videos appear in table after adding
- [ ] Edit function works
- [ ] Delete function works
- [ ] Mobile responsive (test on phone)

### Integration
- [ ] Sample data inserted (3 videos)
- [ ] Can upload actual video file
- [ ] Public URL generates correctly
- [ ] Videos play when clicked
- [ ] Active/inactive toggle works

---

## 🐛 Troubleshooting

### Issue: "Table doesn't exist" error
**Solution**: Run the SQL migration script in Supabase SQL Editor

### Issue: Upload fails with "Bucket not found"
**Solution**: Create the `payment-videos` storage bucket in Supabase Dashboard

### Issue: "Permission denied" on upload
**Solution**: Add the storage policies (see Step 2 above)

### Issue: Video uploads but URL is private
**Solution**: Make sure bucket is set to "Public" in storage settings

### Issue: File size error
**Solution**: 
- Check file is under 50MB
- Verify bucket size limit is set to 52428800 bytes

### Issue: Videos don't show in table
**Solution**:
- Refresh page
- Check console for errors
- Verify database query returns data

### Issue: Upload button disabled
**Solution**:
- Make sure title is filled (min 3 chars)
- Ensure video URL is present OR file is uploaded
- Check you're logged in as admin

---

## 📞 Support Resources

**Supabase Dashboard**:  
https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj

**SQL Editor** (run migration here):  
https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj/sql

**Storage** (create bucket here):  
https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj/storage

**GitHub Repository**:  
https://github.com/ismailopm12/is-shop

---

## 🎯 Usage Examples

### Example 1: Add bKash Tutorial Video

**Scenario**: You have a screen recording showing how to deposit via bKash

1. Go to Admin → Wallet
2. Click "Add New Video"
3. Title: "বিকাশে টাকা জমা দেওয়ার সম্পূর্ণ নিয়ম"
4. Description: "৫ মিনিটের টিউটোরিয়াল - বিকাশ অ্যাপ ব্যবহার করে কিভাবে ওয়ালেটে টাকা যোগ করবেন"
5. Click "Select File"
6. Choose `bkash-tutorial.mp4` (25MB)
7. Wait for upload
8. Keep "Active" checked
9. Click "Add"

✅ **Result**: Video appears in table, ready to show users

---

### Example 2: Add YouTube Video Link

**Scenario**: You uploaded tutorial to YouTube

1. Go to Admin → Wallet
2. Click "Add New Video"
3. Title: "নগদে টাকা জমা দেওয়ার নিয়ম"
4. Description: "YouTube টিউটোরিয়াল - নগদ ডিপোজিট গাইড"
5. Paste YouTube URL: `https://youtube.com/watch?v=...`
6. Keep "Active" checked
7. Click "Add"

✅ **Result**: YouTube video linked and ready to embed

---

### Example 3: Update Old Video

**Scenario**: Old video needs new description

1. Find video in table
2. Click Edit button
3. Update description text
4. Change sort_order to 1 (to make it first)
5. Click "Update"

✅ **Result**: Video updated with new info

---

## 🎉 Success Criteria

Your feature is working correctly when:

1. ✅ SQL migration ran successfully
2. ✅ Storage bucket created and configured
3. ✅ Admin panel shows "Payment Method Videos" section
4. ✅ Can upload video files (under 50MB)
5. ✅ Can paste external video URLs
6. ✅ Videos appear in table immediately
7. ✅ Can edit video details
8. ✅ Can delete videos
9. ✅ Can toggle active/inactive
10. ✅ Works on mobile devices

---

## 📝 Notes

- **First Time Setup**: Requires running SQL + creating bucket (one-time only)
- **Storage Costs**: Videos stored in Supabase Storage (check pricing)
- **Bandwidth**: Public bucket means videos served via CDN (fast loading)
- **Backup**: Download important videos locally as backup
- **Compression**: Compress videos before upload for faster loading
- **SEO**: Add descriptive titles for better search visibility

---

## 🚀 Deployment Status

```
✅ Code committed: 594921e
✅ Pushed to GitHub: main branch
✅ Auto-deploying on Vercel
✅ Live in ~30 seconds
⏳ Database migration needed (manual step)
⏳ Storage bucket creation needed (manual step)
```

---

**Created**: March 14, 2026  
**Feature**: Payment Method Video Upload  
**Status**: ✅ Ready to Setup
