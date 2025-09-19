-- Create customers table for storing landing page signups with pass details
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Landing page association
    landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE,
    
    -- Pass template association
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    
    -- Customer information
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    company TEXT,
    
    -- Additional form data (JSON for flexible fields)
    form_data JSONB DEFAULT '{}',
    
    -- Pass details
    pass_serial_number TEXT UNIQUE,
    pass_type_identifier TEXT,
    pass_url TEXT,
    
    -- Customer status
    is_active BOOLEAN DEFAULT true,
    signup_source TEXT DEFAULT 'landing_page',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure email uniqueness per landing page
    UNIQUE(landing_page_id, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_landing_page_id ON public.customers(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_customers_template_id ON public.customers(template_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_pass_serial_number ON public.customers(pass_serial_number);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their customers" ON public.customers
    FOR SELECT USING (
        landing_page_id IN (
            SELECT id FROM public.landing_pages 
            WHERE business_id IN (
                SELECT account_id 
                FROM public.account_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'staff')
            )
        )
    );

CREATE POLICY "Users can create customers" ON public.customers
    FOR INSERT WITH CHECK (
        landing_page_id IN (
            SELECT id FROM public.landing_pages 
            WHERE business_id IN (
                SELECT account_id 
                FROM public.account_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        )
    );

CREATE POLICY "Users can update their customers" ON public.customers
    FOR UPDATE USING (
        landing_page_id IN (
            SELECT id FROM public.landing_pages 
            WHERE business_id IN (
                SELECT account_id 
                FROM public.account_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
-- Add template_id column to landing_pages table to link with pass templates

-- Add template_id column to landing_pages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'landing_pages' AND column_name = 'template_id') THEN
        ALTER TABLE public.landing_pages ADD COLUMN template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add settings column if it doesn't exist (for storing wizard configuration)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'landing_pages' AND column_name = 'settings') THEN
        ALTER TABLE public.landing_pages ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create index for template_id
CREATE INDEX IF NOT EXISTS idx_landing_pages_template_id ON public.landing_pages(template_id);

-- Update any existing landing pages to have default template (optional)
-- UPDATE public.landing_pages 
-- SET template_id = (SELECT id FROM public.templates LIMIT 1)
-- WHERE template_id IS NULL;
