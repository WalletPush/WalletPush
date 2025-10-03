import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing envs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250103_add_content_model_column.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  console.log('🔄 Applying preview columns migration...')
  const { error } = await supabase.rpc('exec', { sql })
  if (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
  console.log('✅ Migration applied')
}

main().catch((e) => {
  console.error('❌ Migration error:', e)
  process.exit(1)
})


