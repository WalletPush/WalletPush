-- Remove Cloudflare-related fields since we're using Vercel Domains API
-- Clean up unused columns and indexes

-- Drop the index first
DROP INDEX IF EXISTS idx_custom_domains_cloudflare_record_id;

-- Remove the column
ALTER TABLE custom_domains 
DROP COLUMN IF EXISTS cloudflare_record_id;
