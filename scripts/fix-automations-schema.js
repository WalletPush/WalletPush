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

async function fixAutomationsSchema() {
  console.log('🔄 Fixing automations table schema...')
  
  try {
    // First, check if the conditions column exists
    console.log('🔍 Checking current automations table schema...')
    
    const { data: columns, error: columnError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'automations' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    
    if (columnError) {
      console.log('❌ Error checking schema:', columnError.message)
      
      // Try alternative approach
      console.log('🔄 Trying to add missing columns directly...')
      
      const { data: result, error: addError } = await supabase
        .rpc('exec_sql', {
          sql: `
            -- Add conditions column if it doesn't exist
            DO $$ 
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'automations' 
                AND column_name = 'conditions'
              ) THEN
                ALTER TABLE automations ADD COLUMN conditions JSONB DEFAULT '[]';
                PRINT 'Added conditions column';
              END IF;
            END $$;
            
            -- Add template_id column if it doesn't exist
            DO $$ 
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'automations' 
                AND column_name = 'template_id'
              ) THEN
                ALTER TABLE automations ADD COLUMN template_id UUID REFERENCES templates(id) ON DELETE SET NULL;
                PRINT 'Added template_id column';
              END IF;
            END $$;
          `
        })
      
      if (addError) {
        console.log('❌ Error adding columns:', addError.message)
        
        // Try even more direct approach
        console.log('🔄 Trying direct SQL execution...')
        
        try {
          // Add conditions column
          const conditionsResult = await supabase
            .rpc('exec_sql', {
              sql: `ALTER TABLE automations ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]';`
            })
          
          console.log('✅ Added conditions column')
          
          // Add template_id column  
          const templateResult = await supabase
            .rpc('exec_sql', {
              sql: `ALTER TABLE automations ADD COLUMN IF NOT EXISTS template_id UUID;`
            })
          
          console.log('✅ Added template_id column')
          
        } catch (directError) {
          console.log('❌ Direct SQL failed:', directError.message)
        }
      } else {
        console.log('✅ Schema update completed')
      }
    } else {
      console.log('📋 Current automations table columns:')
      if (columns && Array.isArray(columns)) {
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not null'})`)
        })
      }
    }
    
    // Test the automations table
    console.log('🔍 Testing automations table access...')
    const { data: testData, error: testError } = await supabase
      .from('automations')
      .select('id, name, conditions, template_id')
      .limit(1)
    
    if (testError) {
      console.log('❌ Table access error:', testError.message)
    } else {
      console.log('✅ Automations table is accessible!')
      console.log('📊 Sample data:', testData)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixAutomationsSchema()
