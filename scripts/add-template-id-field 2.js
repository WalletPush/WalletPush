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

async function addTemplateIdField() {
  console.log('🔄 Adding template_id field to automations table...')
  
  try {
    // Check if template_id column already exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'automations')
      .eq('column_name', 'template_id')
    
    if (columnError) {
      console.log('❌ Error checking columns:', columnError.message)
      return
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ template_id field already exists!')
      return
    }
    
    // Add template_id column using SQL
    console.log('📝 Adding template_id column...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE automations 
        ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_automations_template_id ON automations(template_id);
      `
    })
    
    if (error) {
      console.log('❌ Error adding template_id field:', error.message)
      console.log('🔄 Trying alternative approach...')
      
      // Try using direct SQL execution
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: `ALTER TABLE automations ADD COLUMN IF NOT EXISTS template_id UUID;`
        })
      })
      
      if (response.ok) {
        console.log('✅ template_id field added successfully!')
      } else {
        console.log('❌ Failed to add template_id field via REST API')
      }
    } else {
      console.log('✅ template_id field added successfully!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addTemplateIdField()
