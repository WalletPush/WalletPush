const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Supabase URL:', supabaseUrl)
console.log('🔑 Service key exists:', !!supabaseServiceKey)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixSchema() {
  console.log('🔄 Attempting to fix automations schema...')
  
  try {
    // Try to query the current table structure
    console.log('🔍 Checking current automations table...')
    
    const { data: existingData, error: queryError } = await supabase
      .from('automations')
      .select('*')
      .limit(1)
    
    console.log('📊 Query result:', { data: existingData, error: queryError })
    
    if (queryError) {
      console.log('❌ Query error:', queryError.message)
      
      // The table might not exist or have wrong schema
      console.log('🔄 Attempting to create/recreate automations table...')
      
      // Let's try to use the REST API directly to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: `
            -- Drop and recreate automations table with correct schema
            DROP TABLE IF EXISTS automations CASCADE;
            
            CREATE TABLE automations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              business_id UUID NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused')),
              trigger_type TEXT NOT NULL CHECK (trigger_type IN (
                'pass.created',
                'pass.updated', 
                'pass.downloaded',
                'registration.created',
                'registration.deleted',
                'scan.performed',
                'custom_field_updated',
                'webhook'
              )),
              trigger_config JSONB DEFAULT '{}',
              conditions JSONB DEFAULT '[]',
              actions JSONB NOT NULL DEFAULT '[]',
              template_id UUID,
              total_enrolled INTEGER DEFAULT 0,
              active_enrolled INTEGER DEFAULT 0,
              total_executions INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              last_executed_at TIMESTAMP WITH TIME ZONE
            );
            
            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_automations_business_id ON automations(business_id);
            CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON automations(trigger_type);
            CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
            CREATE INDEX IF NOT EXISTS idx_automations_template_id ON automations(template_id);
          `
        })
      })
      
      if (response.ok) {
        console.log('✅ Table recreated successfully')
      } else {
        const errorText = await response.text()
        console.log('❌ REST API error:', errorText)
        
        // Try alternative approach - use SQL editor endpoint
        console.log('🔄 Trying SQL editor approach...')
        
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS automations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_id UUID NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'draft',
                trigger_type TEXT NOT NULL,
                trigger_config JSONB DEFAULT '{}',
                conditions JSONB DEFAULT '[]',
                actions JSONB NOT NULL DEFAULT '[]',
                template_id UUID,
                total_enrolled INTEGER DEFAULT 0,
                active_enrolled INTEGER DEFAULT 0,
                total_executions INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_executed_at TIMESTAMP WITH TIME ZONE
              );
            `
          })
        })
        
        console.log('SQL editor response:', sqlResponse.status, await sqlResponse.text())
      }
    } else {
      console.log('✅ Table exists and is queryable')
      console.log('📊 Sample data:', existingData)
    }
    
    // Test the table again
    console.log('🔍 Final test of automations table...')
    const { data: finalTest, error: finalError } = await supabase
      .from('automations')
      .select('id, name, conditions, template_id, actions')
      .limit(1)
    
    if (finalError) {
      console.log('❌ Final test failed:', finalError.message)
    } else {
      console.log('✅ Final test passed!')
      console.log('📊 Final data:', finalTest)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixSchema()
