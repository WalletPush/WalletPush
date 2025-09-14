-- Create agency_sales_pages table for template library system
-- This table stores both sales pages and templates

CREATE TABLE IF NOT EXISTS public.agency_sales_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Agency/Account association
    agency_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    
    -- Page basic info
    page_name TEXT NOT NULL,
    page_type TEXT NOT NULL DEFAULT 'general', -- 'loyalty', 'coupon', 'store-card', 'membership', 'general'
    page_slug TEXT NOT NULL,
    page_title TEXT NOT NULL,
    page_subtitle TEXT,
    target_audience TEXT,
    
    -- Images
    hero_image_url TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    
    -- Content
    headline TEXT NOT NULL,
    subheadline TEXT,
    value_proposition TEXT,
    call_to_action TEXT DEFAULT 'Get Started',
    
    -- Structured data (JSON)
    features JSONB DEFAULT '[]',
    testimonials JSONB DEFAULT '[]',
    selected_packages JSONB DEFAULT '[]',
    
    -- Styling
    template_style TEXT DEFAULT 'modern',
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#64748b',
    accent_color TEXT DEFAULT '#10b981',
    font_family TEXT DEFAULT 'Inter',
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Publishing
    is_published BOOLEAN DEFAULT false,
    custom_domain TEXT,
    analytics_code TEXT,
    
    -- Template system
    is_template BOOLEAN DEFAULT false,
    template_category TEXT, -- 'business-main', 'membership', 'restaurant', 'fitness', 'retail', etc.
    template_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_agency_account_id ON public.agency_sales_pages(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_is_template ON public.agency_sales_pages(is_template);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_template_category ON public.agency_sales_pages(template_category);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_page_type ON public.agency_sales_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_is_published ON public.agency_sales_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_created_at ON public.agency_sales_pages(created_at);

-- Enable Row Level Security
ALTER TABLE public.agency_sales_pages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view templates and their own pages" ON public.agency_sales_pages
    FOR SELECT USING (
        -- Global templates (no agency_account_id) are visible to everyone
        (is_template = true AND agency_account_id IS NULL) OR
        -- Users can see pages from their own agency accounts
        agency_account_id IN (
            SELECT account_id 
            FROM public.account_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'staff')
        )
    );

CREATE POLICY "Users can create pages for their agencies" ON public.agency_sales_pages
    FOR INSERT WITH CHECK (
        agency_account_id IN (
            SELECT account_id 
            FROM public.account_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can update their agency pages" ON public.agency_sales_pages
    FOR UPDATE USING (
        agency_account_id IN (
            SELECT account_id 
            FROM public.account_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can delete their agency pages" ON public.agency_sales_pages
    FOR DELETE USING (
        agency_account_id IN (
            SELECT account_id 
            FROM public.account_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_sales_pages TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agency_sales_pages_updated_at
    BEFORE UPDATE ON public.agency_sales_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.agency_sales_pages IS 'Stores agency sales pages and global templates for the template library system';
