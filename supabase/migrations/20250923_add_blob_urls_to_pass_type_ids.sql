-- Add blob URL columns to pass_type_ids table for Vercel Blob storage
-- This allows storing certificate URLs instead of local file paths

ALTER TABLE pass_type_ids 
ADD COLUMN IF NOT EXISTS p12_blob_url TEXT,
ADD COLUMN IF NOT EXISTS wwdr_blob_url TEXT,
ADD COLUMN IF NOT EXISTS cert_password TEXT;

-- Add comments for documentation
COMMENT ON COLUMN pass_type_ids.p12_blob_url IS 'Vercel Blob URL for the P12 certificate file';
COMMENT ON COLUMN pass_type_ids.wwdr_blob_url IS 'Vercel Blob URL for the WWDR certificate file';
COMMENT ON COLUMN pass_type_ids.cert_password IS 'Password for the P12 certificate';
