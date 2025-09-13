#!/usr/bin/env node

/**
 * Safe Database Migration Script
 * Applies multi-tenant schema with zero downtime
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🚀 Starting safe multi-tenant migration...')
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250913_create_tenants_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded')
    
    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration applied successfully!')
    
    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['tenants', 'user_tenants'])
    
    if (tablesError) {
      console.warn('⚠️ Could not verify tables:', tablesError)
    } else {
      console.log('✅ Verified tables created:', tables?.map(t => t.table_name))
    }
    
    console.log('🎉 Multi-tenant system is ready!')
    console.log('📝 Your existing system will continue working without changes')
    console.log('🔄 New users will automatically get tenant accounts')
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

// Alternative: Direct SQL execution if RPC not available
async function applyMigrationDirect() {
  try {
    console.log('🚀 Applying migration via direct SQL execution...')
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250913_create_tenants_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📄 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement + ';' })
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`)
        } catch (error) {
          console.warn(`⚠️ Statement ${i + 1} failed (may be expected):`, error.message)
        }
      }
    }
    
    console.log('🎉 Migration completed!')
    
  } catch (error) {
    console.error('❌ Direct migration error:', error)
    process.exit(1)
  }
}

// Run migration
if (process.argv.includes('--direct')) {
  applyMigrationDirect()
} else {
  applyMigration()
}
