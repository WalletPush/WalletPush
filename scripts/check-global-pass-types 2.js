#!/usr/bin/env node

/**
 * Check Global Pass Type IDs
 * This script verifies that global Pass Type IDs are properly preserved
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables manually
const fs = require('fs')
const path = require('path')

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const lines = envContent.split('\n')
      
      lines.forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
          process.env[key.trim()] = value.trim()
        }
      })
    }
  } catch (error) {
    console.log('⚠️ Could not load .env.local, using process.env')
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkGlobalPassTypes() {
  try {
    console.log('🔍 Checking global Pass Type IDs...')
    
    // Check for global Pass Type IDs
    const { data: globalPassTypes, error: globalError } = await supabase
      .from('pass_type_ids')
      .select('*')
      .eq('is_global', true)
    
    if (globalError) {
      console.error('❌ Error fetching global Pass Type IDs:', globalError)
      return
    }
    
    console.log(`✅ Found ${globalPassTypes?.length || 0} global Pass Type IDs:`)
    
    globalPassTypes?.forEach((pt, index) => {
      console.log(`\n${index + 1}. ${pt.label}`)
      console.log(`   ID: ${pt.id}`)
      console.log(`   Identifier: ${pt.pass_type_identifier}`)
      console.log(`   Team ID: ${pt.team_id}`)
      console.log(`   Is Global: ${pt.is_global}`)
      console.log(`   Is Validated: ${pt.is_validated}`)
      console.log(`   Account ID: ${pt.account_id || 'NULL (correct for global)'}`)
      console.log(`   Tenant ID: ${pt.tenant_id || 'NULL'}`)
      console.log(`   Created: ${pt.created_at}`)
    })
    
    // Check all Pass Type IDs to see the structure
    const { data: allPassTypes, error: allError } = await supabase
      .from('pass_type_ids')
      .select('id, label, is_global, account_id')
      .order('is_global', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.error('❌ Error fetching all Pass Type IDs:', allError)
      return
    }
    
    console.log(`\n📊 Total Pass Type IDs: ${allPassTypes?.length || 0}`)
    console.log('📋 Summary:')
    allPassTypes?.forEach(pt => {
      console.log(`   ${pt.label} - Global: ${pt.is_global}, Account: ${pt.account_id || 'NULL'}`)
    })
    
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

checkGlobalPassTypes()