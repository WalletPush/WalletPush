-- Add Cloudflare record ID to custom_domains table
-- This allows us to manage DNS records programmatically

ALTER TABLE custom_domains 
ADD COLUMN cloudflare_record_id VARCHAR(255);

-- Add index for performance
CREATE INDEX idx_custom_domains_cloudflare_record_id 
ON custom_domains(cloudflare_record_id);

-- Add comment
COMMENT ON COLUMN custom_domains.cloudflare_record_id IS 'Cloudflare DNS record ID for programmatic management';
