-- Add Vercel domain management fields to custom_domains table
-- This allows us to track Vercel domain registration and verification

ALTER TABLE custom_domains 
ADD COLUMN vercel_domain_id VARCHAR(255),
ADD COLUMN verification_instructions JSONB;

-- Add index for performance
CREATE INDEX idx_custom_domains_vercel_domain_id 
ON custom_domains(vercel_domain_id);

-- Add comments
COMMENT ON COLUMN custom_domains.vercel_domain_id IS 'Vercel domain identifier for API management';
COMMENT ON COLUMN custom_domains.verification_instructions IS 'JSON array of DNS verification requirements from Vercel';
