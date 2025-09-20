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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
  console.log('Key:', supabaseServiceKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Applying automations system migration...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'create_automations_system.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 Executing migration SQL...')
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      
      // Try creating tables individually with basic CREATE statements
      console.log('🔄 Trying individual table creation...')
      
      const tables = [
        `CREATE TABLE IF NOT EXISTS webhook_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID NOT NULL,
          template_id UUID,
          event_type TEXT NOT NULL,
          webhook_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS automations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          trigger_type TEXT NOT NULL,
          trigger_config JSONB DEFAULT '{}',
          conditions JSONB DEFAULT '[]',
          actions JSONB NOT NULL DEFAULT '[]',
          total_enrolled INTEGER DEFAULT 0,
          active_enrolled INTEGER DEFAULT 0,
          total_executions INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_executed_at TIMESTAMP WITH TIME ZONE
        )`,
        `CREATE TABLE IF NOT EXISTS automation_executions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          automation_id UUID NOT NULL,
          customer_id UUID,
          trigger_data JSONB,
          execution_status TEXT NOT NULL,
          actions_executed JSONB DEFAULT '[]',
          error_message TEXT,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE
        )`
      ]
      
      for (const table of tables) {
        const { error: tableError } = await supabase.rpc('exec_sql', { sql: table })
        if (tableError) {
          console.error('❌ Table creation failed:', tableError)
        } else {
          console.log('✅ Table created successfully')
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }
    
    // Test the tables were created
    console.log('🔍 Verifying tables...')
    
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('*')
      .limit(1)
      
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .limit(1)
      
    if (automationsError) {
      console.error('❌ automations table check failed:', automationsError)
    } else {
      console.log('✅ automations table exists and accessible')
    }
    
    if (webhookError) {
      console.error('❌ webhook_events table check failed:', webhookError)
    } else {
      console.log('✅ webhook_events table exists and accessible')
    }
    
    console.log('🎉 Migration process completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

applyMigration()