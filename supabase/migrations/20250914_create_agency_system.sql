-- Create agency_accounts table
CREATE TABLE IF NOT EXISTS public.agency_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    company_name TEXT,
    website TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
    subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'business', 'enterprise')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agency_settings table
CREATE TABLE IF NOT EXISTS public.agency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_account_id UUID NOT NULL REFERENCES public.agency_accounts(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_account_id, setting_key)
);

-- Create RLS policies for agency_accounts
ALTER TABLE public.agency_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agency accounts" ON public.agency_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agency accounts" ON public.agency_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agency accounts" ON public.agency_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for agency_settings
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency settings" ON public.agency_settings
    FOR SELECT USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their agency settings" ON public.agency_settings
    FOR INSERT WITH CHECK (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their agency settings" ON public.agency_settings
    FOR UPDATE USING (
        agency_account_id IN (
            SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agency_accounts_user_id ON public.agency_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_accounts_email ON public.agency_accounts(email);
CREATE INDEX IF NOT EXISTS idx_agency_accounts_subscription_status ON public.agency_accounts(subscription_status);
CREATE INDEX IF NOT EXISTS idx_agency_settings_agency_account_id ON public.agency_settings(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON public.agency_settings(setting_key);

-- Insert a sample agency account for testing (using the current user)
-- This will be created when a user first accesses the agency dashboard
