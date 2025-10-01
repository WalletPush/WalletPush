-- Add agency owner pricing tier field to distinguish from business subscription plans
ALTER TABLE public.agency_accounts 
ADD COLUMN IF NOT EXISTS owner_pricing_tier TEXT DEFAULT 'starter_100k' 
CHECK (owner_pricing_tier IN ('starter_100k', 'business_150k', 'enterprise_250k'));

-- Add index for pricing tier lookups
CREATE INDEX IF NOT EXISTS idx_agency_accounts_owner_pricing_tier 
ON public.agency_accounts(owner_pricing_tier);

-- Update existing records to have default pricing tier
UPDATE public.agency_accounts 
SET owner_pricing_tier = 'starter_100k' 
WHERE owner_pricing_tier IS NULL;

