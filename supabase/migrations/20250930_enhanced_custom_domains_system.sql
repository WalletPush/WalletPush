-- Enhanced Custom Domain System for 3-Tier Hierarchy
-- Supports: Platform (walletpush.io) → Agency (myagency.com) → Business (mybusiness.com)

-- 1. Ensure custom_domains table exists with proper structure
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'expired')),
    ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
    vercel_domain_id TEXT,
    verification_instructions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add domain type to distinguish agency vs business domains
ALTER TABLE public.custom_domains 
ADD COLUMN IF NOT EXISTS domain_type TEXT DEFAULT 'business' CHECK (domain_type IN ('agency', 'business'));

-- 3. Add agency_id reference for agency domains
ALTER TABLE public.custom_domains 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agency_accounts(id) ON DELETE CASCADE;

-- 4. Update constraint to allow either business_id OR agency_id (but not both)
ALTER TABLE public.custom_domains 
DROP CONSTRAINT IF EXISTS custom_domains_business_id_not_null;

-- Add check constraint to ensure either business_id or agency_id is set based on domain_type
ALTER TABLE public.custom_domains 
ADD CONSTRAINT custom_domains_owner_check CHECK (
    (domain_type = 'business' AND business_id IS NOT NULL AND agency_id IS NULL) OR
    (domain_type = 'agency' AND agency_id IS NOT NULL AND business_id IS NULL)
);

-- 5. Add DNS verification fields
ALTER TABLE public.custom_domains 
ADD COLUMN IF NOT EXISTS dns_verification_record TEXT,
ADD COLUMN IF NOT EXISTS dns_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMP WITH TIME ZONE;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain_active ON custom_domains(domain, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_custom_domains_business_active ON custom_domains(business_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_custom_domains_agency_active ON custom_domains(agency_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_custom_domains_type ON custom_domains(domain_type);

-- 7. Add domain hierarchy tracking
CREATE TABLE IF NOT EXISTS public.domain_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_domain TEXT NOT NULL,
    child_domain TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('agency_to_business', 'platform_to_agency')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_domain, child_domain)
);

-- 8. Create function to resolve domain ownership hierarchy
CREATE OR REPLACE FUNCTION public.resolve_domain_context(input_domain TEXT)
RETURNS TABLE (
    domain_type TEXT,
    owner_id UUID,
    owner_name TEXT,
    agency_id UUID,
    agency_name TEXT,
    business_id UUID,
    business_name TEXT
) AS $$
BEGIN
    -- First check if it's a business custom domain
    RETURN QUERY
    SELECT 
        'business'::TEXT as domain_type,
        cd.business_id as owner_id,
        b.name as owner_name,
        b.agency_account_id as agency_id,
        aa.name as agency_name,
        b.id as business_id,
        b.name as business_name
    FROM custom_domains cd
    JOIN businesses b ON cd.business_id = b.id
    LEFT JOIN agency_accounts aa ON b.agency_account_id = aa.id
    WHERE cd.domain = input_domain 
    AND cd.status = 'active' 
    AND cd.domain_type = 'business';
    
    -- If no business domain found, check for agency domain
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            'agency'::TEXT as domain_type,
            cd.agency_id as owner_id,
            aa.name as owner_name,
            aa.id as agency_id,
            aa.name as agency_name,
            NULL::UUID as business_id,
            NULL::TEXT as business_name
        FROM custom_domains cd
        JOIN agency_accounts aa ON cd.agency_id = aa.id
        WHERE cd.domain = input_domain 
        AND cd.status = 'active' 
        AND cd.domain_type = 'agency';
    END IF;
    
    -- If no custom domain found, check if it's the platform domain
    IF NOT FOUND AND input_domain IN ('walletpush.io', 'www.walletpush.io') THEN
        RETURN QUERY
        SELECT 
            'platform'::TEXT as domain_type,
            NULL::UUID as owner_id,
            'WalletPush'::TEXT as owner_name,
            NULL::UUID as agency_id,
            NULL::TEXT as agency_name,
            NULL::UUID as business_id,
            NULL::TEXT as business_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to get agency domain for business routing
CREATE OR REPLACE FUNCTION public.get_agency_domain_for_business(input_business_id UUID)
RETURNS TEXT AS $$
DECLARE
    agency_domain TEXT;
BEGIN
    SELECT aa.custom_domain INTO agency_domain
    FROM businesses b
    JOIN agency_accounts aa ON b.agency_account_id = aa.id
    WHERE b.id = input_business_id
    AND aa.custom_domain_status = 'active';
    
    RETURN agency_domain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update RLS policies for custom_domains
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view domains for their business" ON public.custom_domains;
DROP POLICY IF EXISTS "Users can insert domains for their business" ON public.custom_domains;
DROP POLICY IF EXISTS "Users can update domains for their business" ON public.custom_domains;
DROP POLICY IF EXISTS "Users can delete domains for their business" ON public.custom_domains;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view custom domains" ON public.custom_domains
    FOR SELECT USING (
        -- Business owners can see their business domains
        (domain_type = 'business' AND business_id IN (
            SELECT b.id FROM businesses b
            JOIN account_members am ON am.account_id = b.account_id
            WHERE am.user_id = auth.uid()
        )) OR
        -- Agency owners can see their agency domains and their businesses' domains
        (domain_type = 'agency' AND agency_id IN (
            SELECT aa.id FROM agency_accounts aa
            WHERE aa.user_id = auth.uid()
        )) OR
        (domain_type = 'business' AND business_id IN (
            SELECT b.id FROM businesses b
            JOIN agency_accounts aa ON b.agency_account_id = aa.id
            WHERE aa.user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert custom domains" ON public.custom_domains
    FOR INSERT WITH CHECK (
        -- Business owners can add domains for their business
        (domain_type = 'business' AND business_id IN (
            SELECT b.id FROM businesses b
            JOIN account_members am ON am.account_id = b.account_id
            WHERE am.user_id = auth.uid()
        )) OR
        -- Agency owners can add domains for their agency
        (domain_type = 'agency' AND agency_id IN (
            SELECT aa.id FROM agency_accounts aa
            WHERE aa.user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can update custom domains" ON public.custom_domains
    FOR UPDATE USING (
        -- Same logic as SELECT
        (domain_type = 'business' AND business_id IN (
            SELECT b.id FROM businesses b
            JOIN account_members am ON am.account_id = b.account_id
            WHERE am.user_id = auth.uid()
        )) OR
        (domain_type = 'agency' AND agency_id IN (
            SELECT aa.id FROM agency_accounts aa
            WHERE aa.user_id = auth.uid()
        )) OR
        (domain_type = 'business' AND business_id IN (
            SELECT b.id FROM businesses b
            JOIN agency_accounts aa ON b.agency_account_id = aa.id
            WHERE aa.user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can delete custom domains" ON public.custom_domains
    FOR DELETE USING (
        -- Same logic as SELECT
        (domain_type = 'business' AND business_id IN (
            SELECT b.id FROM businesses b
            JOIN account_members am ON am.account_id = b.account_id
            WHERE am.user_id = auth.uid()
        )) OR
        (domain_type = 'agency' AND agency_id IN (
            SELECT aa.id FROM agency_accounts aa
            WHERE aa.user_id = auth.uid()
        )) OR
        (domain_type = 'business' AND business_id IN (
            SELECT b.id FROM businesses b
            JOIN agency_accounts aa ON b.agency_account_id = aa.id
            WHERE aa.user_id = auth.uid()
        ))
    );

-- 11. Add comments for documentation
COMMENT ON TABLE public.custom_domains IS 'Manages custom domains for both agencies and businesses in the 3-tier hierarchy';
COMMENT ON COLUMN public.custom_domains.domain_type IS 'Type of domain: agency (myagency.com) or business (mybusiness.com)';
COMMENT ON COLUMN public.custom_domains.business_id IS 'Business ID for business-type domains';
COMMENT ON COLUMN public.custom_domains.agency_id IS 'Agency ID for agency-type domains';
COMMENT ON COLUMN public.custom_domains.dns_verification_record IS 'DNS TXT record value for domain verification';
COMMENT ON FUNCTION public.resolve_domain_context IS 'Resolves domain ownership and hierarchy context for routing';
COMMENT ON FUNCTION public.get_agency_domain_for_business IS 'Gets the agency domain for a business to construct proper URLs';

