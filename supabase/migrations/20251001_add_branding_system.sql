-- Add branding fields to agency_accounts table
ALTER TABLE public.agency_accounts 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF';

-- Add branding fields to businesses table  
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6', 
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF';

-- Create branding_assets table for secure logo storage
CREATE TABLE IF NOT EXISTS public.branding_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('agency', 'business')),
    entity_id UUID NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'favicon', 'banner')),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    domain_locked TEXT NOT NULL, -- Security: Lock asset to specific domain
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one logo per entity per domain
    UNIQUE(entity_type, entity_id, asset_type, domain_locked)
);

-- Add foreign key constraints
ALTER TABLE public.branding_assets
ADD CONSTRAINT branding_assets_agency_fk 
    FOREIGN KEY (entity_id) 
    REFERENCES public.agency_accounts(id) 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;

-- Note: We can't add a single FK for both agencies and businesses
-- So we'll handle this with RLS policies instead

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_branding_assets_entity ON public.branding_assets(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_branding_assets_domain ON public.branding_assets(domain_locked);
CREATE INDEX IF NOT EXISTS idx_agency_accounts_logo ON public.agency_accounts(logo_url) WHERE logo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_logo ON public.businesses(logo_url) WHERE logo_url IS NOT NULL;

-- Enable RLS on branding_assets
ALTER TABLE public.branding_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view branding for their own entities
CREATE POLICY "Users can view their branding assets" ON public.branding_assets
    FOR SELECT USING (
        -- Agency owners can see their agency branding
        (entity_type = 'agency' AND entity_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )) OR
        -- Business owners can see their business branding  
        (entity_type = 'business' AND entity_id IN (
            SELECT b.id FROM public.businesses b
            JOIN public.account_members am ON am.account_id = b.account_id
            WHERE am.user_id = auth.uid()
        ))
    );

-- RLS Policy: Users can only insert branding for entities they own
CREATE POLICY "Users can insert their branding assets" ON public.branding_assets
    FOR INSERT WITH CHECK (
        -- Agency owners can upload agency branding
        (entity_type = 'agency' AND entity_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )) OR
        -- Business owners can upload business branding
        (entity_type = 'business' AND entity_id IN (
            SELECT b.id FROM public.businesses b
            JOIN public.account_members am ON am.account_id = b.account_id  
            WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
        ))
    );

-- RLS Policy: Users can only update their own branding
CREATE POLICY "Users can update their branding assets" ON public.branding_assets
    FOR UPDATE USING (
        -- Same logic as SELECT
        (entity_type = 'agency' AND entity_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )) OR
        (entity_type = 'business' AND entity_id IN (
            SELECT b.id FROM public.businesses b
            JOIN public.account_members am ON am.account_id = b.account_id
            WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
        ))
    );

-- RLS Policy: Users can only delete their own branding
CREATE POLICY "Users can delete their branding assets" ON public.branding_assets
    FOR DELETE USING (
        -- Same logic as SELECT
        (entity_type = 'agency' AND entity_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )) OR
        (entity_type = 'business' AND entity_id IN (
            SELECT b.id FROM public.businesses b
            JOIN public.account_members am ON am.account_id = b.account_id
            WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
        ))
    );

-- Function to get branding for a domain (used by the app)
CREATE OR REPLACE FUNCTION public.get_branding_for_domain(input_domain TEXT)
RETURNS TABLE (
    logo_url TEXT,
    company_name TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    branding_type TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- First check for business domain
    RETURN QUERY
    SELECT 
        b.logo_url,
        b.name as company_name,
        b.primary_color,
        b.secondary_color,
        'business'::TEXT as branding_type
    FROM public.custom_domains cd
    JOIN public.businesses b ON cd.business_id = b.id
    WHERE cd.domain = input_domain 
    AND cd.status = 'active' 
    AND cd.domain_type = 'business';
    
    -- If no business domain found, check for agency domain
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            aa.logo_url,
            aa.name as company_name,
            aa.primary_color,
            aa.secondary_color,
            'agency'::TEXT as branding_type
        FROM public.custom_domains cd
        JOIN public.agency_accounts aa ON cd.agency_id = aa.id
        WHERE cd.domain = input_domain 
        AND cd.status = 'active' 
        AND cd.domain_type = 'agency';
    END IF;
    
    -- If no custom domain found, return platform branding for walletpush.io
    IF NOT FOUND AND input_domain IN ('walletpush.io', 'www.walletpush.io') THEN
        RETURN QUERY
        SELECT 
            '/images/walletpush-logo.png'::TEXT as logo_url,
            'WalletPush'::TEXT as company_name,
            '#3B82F6'::TEXT as primary_color,
            '#1E40AF'::TEXT as secondary_color,
            'platform'::TEXT as branding_type;
    END IF;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE public.branding_assets IS 'Secure storage for agency and business branding assets with domain-locking';
COMMENT ON COLUMN public.branding_assets.domain_locked IS 'Security: Locks branding asset to specific domain to prevent cross-contamination';
COMMENT ON FUNCTION public.get_branding_for_domain IS 'Securely resolves branding configuration for a given domain';
