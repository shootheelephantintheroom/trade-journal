-- Add screenshot_url column to trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshot_url TEXT DEFAULT NULL;

-- MANUAL SETUP REQUIRED:
-- Create a Supabase Storage bucket named "screenshots" in the Supabase Dashboard.
-- Settings:
--   - Public bucket: true
--   - Allowed MIME types: image/png, image/jpeg, image/webp
--   - Max file size: 5MB
--
-- Then add an RLS policy so users can only upload to their own folder:
--   - Policy name: "Users upload to own folder"
--   - Allowed operation: INSERT
--   - Policy definition: (bucket_id = 'screenshots') AND ((storage.foldername(name))[1] = auth.uid()::text)
--
-- And a SELECT policy so anyone can read (public bucket):
--   - Policy name: "Public read access"
--   - Allowed operation: SELECT
--   - Policy definition: bucket_id = 'screenshots'
