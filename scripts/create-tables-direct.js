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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTables() {
  console.log('🔄 Creating automations tables...')
  
  try {
    // Create webhook_events table using REST API
    console.log('📝 Creating webhook_events table...')
    const webhookResult = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `CREATE TABLE IF NOT EXISTS webhook_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID NOT NULL,
          template_id UUID,
          event_type TEXT NOT NULL CHECK (event_type IN (
            'pass.created',
            'pass.updated', 
            'pass.downloaded',
            'registration.created',
            'registration.deleted',
            'scan.performed',
            'custom_field_updated'
          )),
          webhook_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`
      })
    })
    
    if (!webhookResult.ok) {
      console.log('webhook_events table might already exist or using direct queries...')
    }
    
    // Try creating automations table
    console.log('📝 Creating automations table...')
    const automationResult = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `CREATE TABLE IF NOT EXISTS automations (
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
          total_enrolled INTEGER DEFAULT 0,
          active_enrolled INTEGER DEFAULT 0,
          total_executions INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_executed_at TIMESTAMP WITH TIME ZONE
        );`
      })
    })
    
    // Test if we can access the tables
    console.log('🔍 Testing table access...')
    
    const { data: automationsTest, error: automationsError } = await supabase
      .from('automations')
      .select('*')
      .limit(1)
    
    if (automationsError) {
      console.log('❌ automations table not accessible:', automationsError.message)
      console.log('🔄 Tables may need to be created manually via Supabase dashboard')
    } else {
      console.log('✅ automations table is accessible!')
    }
    
    const { data: webhookTest, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .limit(1)
    
    if (webhookError) {
      console.log('❌ webhook_events table not accessible:', webhookError.message)
    } else {
      console.log('✅ webhook_events table is accessible!')
    }
    
    // If tables don't exist, let's create some sample data to test the API endpoints
    if (!automationsError) {
      console.log('🔍 Checking for existing sample data...')
      
      const { data: existingAutomations } = await supabase
        .from('automations')
        .select('*')
        .limit(1)
      
      if (!existingAutomations || existingAutomations.length === 0) {
        console.log('📝 Creating sample automation for testing...')
        
        // We need a business_id - let's get one from business_user table
        const { data: businessUsers } = await supabase
          .from('business_user')
          .select('business_id')
          .limit(1)
        
        if (businessUsers && businessUsers.length > 0) {
          const { data: sampleAutomation, error: insertError } = await supabase
            .from('automations')
            .insert({
              business_id: businessUsers[0].business_id,
              name: 'Welcome New Members',
              description: 'Send welcome message when pass is installed',
              trigger_type: 'registration.created',
              actions: [
                {
                  type: 'send_push_notification',
                  config: {
                    title: 'Welcome!',
                    message: 'Your pass is ready for use'
                  }
                }
              ],
              status: 'draft'
            })
            .select()
          
          if (insertError) {
            console.log('❌ Failed to create sample automation:', insertError.message)
          } else {
            console.log('✅ Sample automation created for testing!')
          }
        }
      }
    }
    
    console.log('🎉 Table setup completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTables()



