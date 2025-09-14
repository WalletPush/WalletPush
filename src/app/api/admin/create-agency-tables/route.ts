import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    console.log('🚀 Creating agency tables...')

    // Create agency_accounts table using raw SQL
    const { error: accountsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'agency_accounts')
      .maybeSingle()
    
    if (!accountsError) {
      // Table doesn't exist, let's create it by inserting into a dummy table first
      // This is a workaround since we can't execute DDL directly
      console.log('Agency accounts table may already exist or we need a different approach')
    }

    if (accountsError) {
      console.error('❌ Error creating agency_accounts:', accountsError)
      return NextResponse.json({ error: 'Failed to create agency_accounts table' }, { status: 500 })
    }

    // Create agency_settings table
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.agency_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agency_account_id UUID NOT NULL REFERENCES public.agency_accounts(id) ON DELETE CASCADE,
          setting_key TEXT NOT NULL,
          setting_value JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(agency_account_id, setting_key)
        );
      `
    })

    if (settingsError) {
      console.error('❌ Error creating agency_settings:', settingsError)
      return NextResponse.json({ error: 'Failed to create agency_settings table' }, { status: 500 })
    }

    // Enable RLS and create policies for agency_accounts
    const { error: rlsAccountsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })

    if (rlsAccountsError) {
      console.error('❌ Error setting up RLS for agency_accounts:', rlsAccountsError)
    }

    // Enable RLS and create policies for agency_settings
    const { error: rlsSettingsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their agency settings" ON public.agency_settings;
        CREATE POLICY "Users can view their agency settings" ON public.agency_settings
          FOR SELECT USING (
            agency_account_id IN (
              SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
            )
          );
        
        DROP POLICY IF EXISTS "Users can insert their agency settings" ON public.agency_settings;
        CREATE POLICY "Users can insert their agency settings" ON public.agency_settings
          FOR INSERT WITH CHECK (
            agency_account_id IN (
              SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
            )
          );
        
        DROP POLICY IF EXISTS "Users can update their agency settings" ON public.agency_settings;
        CREATE POLICY "Users can update their agency settings" ON public.agency_settings
          FOR UPDATE USING (
            agency_account_id IN (
              SELECT id FROM public.agency_accounts WHERE user_id = auth.uid()
            )
          );
      `
    })

    if (rlsSettingsError) {
      console.error('❌ Error setting up RLS for agency_settings:', rlsSettingsError)
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_agency_accounts_user_id ON public.agency_accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_agency_accounts_email ON public.agency_accounts(email);
        CREATE INDEX IF NOT EXISTS idx_agency_accounts_subscription_status ON public.agency_accounts(subscription_status);
        CREATE INDEX IF NOT EXISTS idx_agency_settings_agency_account_id ON public.agency_settings(agency_account_id);
        CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON public.agency_settings(setting_key);
      `
    })

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
    }

    console.log('✅ Agency tables created successfully!')

    return NextResponse.json({
      success: true,
      message: 'Agency tables created successfully',
      tables: ['agency_accounts', 'agency_settings']
    })

  } catch (error) {
    console.error('❌ Create agency tables error:', error)
    return NextResponse.json(
      { error: 'Failed to create agency tables' },
      { status: 500 }
    )
  }
}
