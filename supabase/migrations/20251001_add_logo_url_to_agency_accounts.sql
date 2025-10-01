-- Add logo_url column to agency_accounts table
ALTER TABLE public.agency_accounts 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add index for logo_url lookups
CREATE INDEX IF NOT EXISTS idx_agency_accounts_logo_url 
ON public.agency_accounts(logo_url) 
WHERE logo_url IS NOT NULL;

