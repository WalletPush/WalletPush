// Script to create the agency_sales_pages table directly in the database
// Run this with: node scripts/create-agency-sales-pages-table.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const createTableSQL = `
-- Create agency_sales_pages table for template library system
CREATE TABLE IF NOT EXISTS public.agency_sales_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Agency/Account association (nullable for global templates)
    agency_account_id UUID,
    
    -- Page basic info
    page_name TEXT NOT NULL,
    page_type TEXT NOT NULL DEFAULT 'general',
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
    template_category TEXT,
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_sales_pages TO authenticated;
`

async function createTable() {
  try {
    console.log('🚀 Creating agency_sales_pages table...')
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (error) {
      console.error('❌ Error creating table:', error)
      
      // Try alternative method - direct SQL execution
      console.log('🔄 Trying alternative method...')
      const { data: altData, error: altError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1)
      
      if (altError) {
        console.error('❌ Database connection failed:', altError)
        process.exit(1)
      }
      
      console.log('✅ Database connection works, but table creation failed')
      console.log('💡 You may need to run this SQL manually in the Supabase dashboard:')
      console.log(createTableSQL)
      process.exit(1)
    }
    
    console.log('✅ Successfully created agency_sales_pages table!')
    console.log('📋 Table is ready for templates')
    
  } catch (error) {
    console.error('❌ Script error:', error)
    process.exit(1)
  }
}

createTable()
