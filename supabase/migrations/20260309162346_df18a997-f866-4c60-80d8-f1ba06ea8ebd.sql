
-- Create storage bucket for product images and banners
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Allow admins to upload files
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update files
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Anyone can view site assets (public bucket)
CREATE POLICY "Anyone can view site assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');
