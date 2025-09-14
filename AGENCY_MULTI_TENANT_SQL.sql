-- =====================================================
-- WALLETPUSH MULTI-TENANT AGENCY SYSTEM
-- Complete SQL for Supabase SQL Editor
-- =====================================================

-- 1. CREATE AGENCY ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.agency_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    company_name TEXT NOT NULL,
    website TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    
    -- Subscription & Billing
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due', 'suspended')),
    subscription_plan TEXT DEFAULT 'agency' CHECK (subscription_plan IN ('agency')),
    monthly_price DECIMAL(10,2) DEFAULT 297.00,
    pass_limit INTEGER DEFAULT 100000,
    businesses_limit INTEGER DEFAULT -1, -- Unlimited
    pass_type_ids_limit INTEGER DEFAULT -1, -- Unlimited
    
    -- Stripe Integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Trial Management
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE AGENCY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.agency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_account_id UUID NOT NULL REFERENCES public.agency_accounts(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL CHECK (setting_key IN (
        'openrouter', 'smtp', 'branding', 'domains', 'webhooks', 'analytics'
    )),
    setting_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_account_id, setting_key)
);

-- 3. CREATE AGENCY PACKAGES TABLE (SAAS Configurator)
CREATE TABLE IF NOT EXISTS public.agency_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_account_id UUID NOT NULL REFERENCES public.agency_accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    pass_limit INTEGER NOT NULL,
    program_limit INTEGER NOT NULL,
    staff_limit INTEGER NOT NULL DEFAULT -1, -- -1 = unlimited
    features JSONB DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE AGENCY SALES PAGES TABLE (Already exists but ensure it's complete)
CREATE TABLE IF NOT EXISTS public.agency_sales_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_account_id UUID REFERENCES public.agency_accounts(id) ON DELETE CASCADE,
    page_name TEXT NOT NULL,
    page_type TEXT DEFAULT 'sales' CHECK (page_type IN ('sales', 'landing', 'template')),
    page_slug TEXT NOT NULL,
    page_title TEXT,
    page_subtitle TEXT,
    target_audience TEXT,
    
    -- Assets
    hero_image_url TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    
    -- Content
    headline TEXT,
    subheadline TEXT,
    value_proposition TEXT,
    call_to_action TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    testimonials JSONB DEFAULT '[]'::jsonb,
    selected_packages JSONB DEFAULT '[]'::jsonb,
    
    -- Design
    template_style TEXT,
    primary_color TEXT DEFAULT '#3862EA',
    secondary_color TEXT DEFAULT '#1E40AF',
    accent_color TEXT DEFAULT '#F59E0B',
    font_family TEXT DEFAULT 'Inter',
    custom_css TEXT,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Publishing
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    custom_domain TEXT,
    analytics_code TEXT,
    
    -- Template System
    is_template BOOLEAN DEFAULT false,
    template_category TEXT,
    template_description TEXT,
    
    -- Generated Content
    html_content TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agency_account_id, page_slug)
);

-- 5. CREATE BUSINESS ACCOUNTS TABLE (Enhanced for Multi-Tenant)
CREATE TABLE IF NOT EXISTS public.business_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_account_id UUID REFERENCES public.agency_accounts(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Business Info
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    company_name TEXT,
    website TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    
    -- Subscription & Limits (from Agency Package)
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    package_name TEXT,
    monthly_price DECIMAL(10,2) DEFAULT 0.00,
    pass_limit INTEGER DEFAULT 1000,
    program_limit INTEGER DEFAULT 3,
    staff_limit INTEGER DEFAULT 2,
    
    -- Pass Type ID Assignment
    assigned_pass_type_id TEXT, -- Only 1 per business
    
    -- Stripe Integration (if direct billing)
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE PASS TYPE IDS TABLE (Agency Management)
CREATE TABLE IF NOT EXISTS public.pass_type_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_account_id UUID REFERENCES public.agency_accounts(id) ON DELETE CASCADE,
    business_account_id UUID REFERENCES public.business_accounts(id) ON DELETE SET NULL,
    
    -- Pass Type ID Details
    pass_type_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'loyalty' CHECK (category IN ('loyalty', 'membership', 'store_card', 'event', 'coupon')),
    
    -- Ownership & Assignment
    created_by TEXT DEFAULT 'agency' CHECK (created_by IN ('agency', 'platform', 'business')),
    assigned_to_business BOOLEAN DEFAULT false,
    is_global BOOLEAN DEFAULT false, -- Platform-level Pass Type IDs
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Apple Developer Details
    team_id TEXT,
    certificate_path TEXT,
    private_key_path TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Agency Accounts RLS
ALTER TABLE public.agency_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own agency accounts" ON public.agency_accounts;
CREATE POLICY "Users can view their own agency accounts" ON public.agency_accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agency accounts" ON public.agency_accounts;
CREATE POLICY "Users can insert their own agency accounts" ON public.agency_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agency accounts" ON public.agency_accounts;
CREATE POLICY "Users can update their own agency accounts" ON public.agency_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- Agency Settings RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their agency settings" ON public.agency_settings;
CREATE POLICY "Users can view their agency settings" ON public.agency_settings
    FOR SELECT USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their agency settings" ON public.agency_settings;
CREATE POLICY "Users can manage their agency settings" ON public.agency_settings
    FOR ALL USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

-- Agency Packages RLS
ALTER TABLE public.agency_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their agency packages" ON public.agency_packages;
CREATE POLICY "Users can manage their agency packages" ON public.agency_packages
    FOR ALL USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

-- Agency Sales Pages RLS
ALTER TABLE public.agency_sales_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view agency sales pages" ON public.agency_sales_pages;
CREATE POLICY "Users can view agency sales pages" ON public.agency_sales_pages
    FOR SELECT USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        ) OR agency_account_id IS NULL -- Global templates
    );

DROP POLICY IF EXISTS "Users can manage their agency sales pages" ON public.agency_sales_pages;
CREATE POLICY "Users can manage their agency sales pages" ON public.agency_sales_pages
    FOR ALL USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

-- Business Accounts RLS (Agency can see their businesses)
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their business accounts" ON public.business_accounts;
CREATE POLICY "Users can view their business accounts" ON public.business_accounts
    FOR SELECT USING (
        auth.uid() = user_id OR 
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage business accounts" ON public.business_accounts;
CREATE POLICY "Users can manage business accounts" ON public.business_accounts
    FOR ALL USING (
        auth.uid() = user_id OR 
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

-- Pass Type IDs RLS
ALTER TABLE public.pass_type_ids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pass type ids" ON public.pass_type_ids;
CREATE POLICY "Users can view pass type ids" ON public.pass_type_ids
    FOR SELECT USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        ) OR 
        business_account_id IN (
            SELECT id FROM public.business_accounts WHERE user_id = auth.uid()
        ) OR
        is_global = true
    );

DROP POLICY IF EXISTS "Agencies can manage pass type ids" ON public.pass_type_ids;
CREATE POLICY "Agencies can manage pass type ids" ON public.pass_type_ids
    FOR ALL USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Agency Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_agency_accounts_user_id ON public.agency_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_accounts_email ON public.agency_accounts(email);
CREATE INDEX IF NOT EXISTS idx_agency_accounts_subscription_status ON public.agency_accounts(subscription_status);
CREATE INDEX IF NOT EXISTS idx_agency_accounts_stripe_customer_id ON public.agency_accounts(stripe_customer_id);

-- Agency Settings Indexes
CREATE INDEX IF NOT EXISTS idx_agency_settings_agency_account_id ON public.agency_settings(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON public.agency_settings(setting_key);

-- Agency Packages Indexes
CREATE INDEX IF NOT EXISTS idx_agency_packages_agency_account_id ON public.agency_packages(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_agency_packages_is_active ON public.agency_packages(is_active);

-- Agency Sales Pages Indexes
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_agency_account_id ON public.agency_sales_pages(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_is_template ON public.agency_sales_pages(is_template);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_template_category ON public.agency_sales_pages(template_category);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_page_slug ON public.agency_sales_pages(page_slug);

-- Business Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_business_accounts_agency_account_id ON public.business_accounts(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_business_accounts_user_id ON public.business_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_accounts_email ON public.business_accounts(email);

-- Pass Type IDs Indexes
CREATE INDEX IF NOT EXISTS idx_pass_type_ids_agency_account_id ON public.pass_type_ids(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_pass_type_ids_business_account_id ON public.pass_type_ids(business_account_id);
CREATE INDEX IF NOT EXISTS idx_pass_type_ids_pass_type_id ON public.pass_type_ids(pass_type_id);
CREATE INDEX IF NOT EXISTS idx_pass_type_ids_is_global ON public.pass_type_ids(is_global);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample agency account (will be created when user first accesses agency dashboard)
-- This is handled by the application logic

-- Insert default agency packages (3 packages as discussed)
-- This will be created via the SAAS Configurator

-- Insert template sales pages
-- These are already inserted via the template system

-- =====================================================
-- FUNCTIONS FOR MULTI-TENANT SUPPORT
-- =====================================================

-- Function to get or create agency account for current user
CREATE OR REPLACE FUNCTION get_or_create_agency_account()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    agency_id UUID;
    current_user_id UUID;
    user_email TEXT;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    
    -- Check if agency account exists
    SELECT id INTO agency_id 
    FROM public.agency_accounts 
    WHERE user_id = current_user_id;
    
    -- Create agency account if it doesn't exist
    IF agency_id IS NULL THEN
        INSERT INTO public.agency_accounts (
            user_id,
            name,
            email,
            company_name
        ) VALUES (
            current_user_id,
            COALESCE(user_email, 'Agency User'),
            user_email,
            'My Agency'
        ) RETURNING id INTO agency_id;
    END IF;
    
    RETURN agency_id;
END;
$$;

-- Function to assign Pass Type ID to business (only 1 per business)
CREATE OR REPLACE FUNCTION assign_pass_type_id_to_business(
    business_id UUID,
    pass_type_id_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the business account with the assigned Pass Type ID
    UPDATE public.business_accounts 
    SET assigned_pass_type_id = pass_type_id_value
    WHERE id = business_id;
    
    -- Mark the Pass Type ID as assigned
    UPDATE public.pass_type_ids 
    SET 
        business_account_id = business_id,
        assigned_to_business = true
    WHERE pass_type_id = pass_type_id_value;
    
    RETURN true;
END;
$$;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_agency_accounts_updated_at ON public.agency_accounts;
CREATE TRIGGER update_agency_accounts_updated_at 
    BEFORE UPDATE ON public.agency_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_settings_updated_at ON public.agency_settings;
CREATE TRIGGER update_agency_settings_updated_at 
    BEFORE UPDATE ON public.agency_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_packages_updated_at ON public.agency_packages;
CREATE TRIGGER update_agency_packages_updated_at 
    BEFORE UPDATE ON public.agency_packages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_sales_pages_updated_at ON public.agency_sales_pages;
CREATE TRIGGER update_agency_sales_pages_updated_at 
    BEFORE UPDATE ON public.agency_sales_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_accounts_updated_at ON public.business_accounts;
CREATE TRIGGER update_business_accounts_updated_at 
    BEFORE UPDATE ON public.business_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pass_type_ids_updated_at ON public.pass_type_ids;
CREATE TRIGGER update_pass_type_ids_updated_at 
    BEFORE UPDATE ON public.pass_type_ids 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE! 
-- Copy this entire SQL and paste it into Supabase SQL Editor
-- =====================================================
