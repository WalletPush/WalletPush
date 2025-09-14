import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Create the agency_sales_pages table (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Creating agency_sales_pages table for user:', user.email)

    // Create the table using raw SQL
    const createTableSQL = `
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
    `

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      console.error('❌ Error creating table:', error)
      return NextResponse.json({ 
        error: 'Failed to create table', 
        details: error.message,
        sql: createTableSQL 
      }, { status: 500 })
    }

    console.log('✅ Successfully created agency_sales_pages table')

    // Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_agency_account_id ON public.agency_sales_pages(agency_account_id);
      CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_is_template ON public.agency_sales_pages(is_template);
      CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_template_category ON public.agency_sales_pages(template_category);
      CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_page_type ON public.agency_sales_pages(page_type);
      CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_is_published ON public.agency_sales_pages(is_published);
      CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_created_at ON public.agency_sales_pages(created_at);
    `

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL })

    if (indexError) {
      console.warn('⚠️ Warning: Failed to create indexes:', indexError)
    } else {
      console.log('✅ Successfully created indexes')
    }

    return NextResponse.json({
      success: true,
      message: 'agency_sales_pages table created successfully',
      tableCreated: true,
      indexesCreated: !indexError
    })

  } catch (error) {
    console.error('❌ Create table API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
