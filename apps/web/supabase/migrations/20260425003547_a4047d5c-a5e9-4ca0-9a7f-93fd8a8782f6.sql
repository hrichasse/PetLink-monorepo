DROP POLICY IF EXISTS "Pet images are publicly visible" ON storage.objects;

CREATE POLICY "Pet images can be viewed by path"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pet-images' AND name IS NOT NULL);