require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function updateTemplateWebService() {
  try {
    const templateId = 'ae76dc2a-e295-4219-b5ce-f6ecd8961de1'
    
    console.log(`🔄 Updating template ${templateId} with production webServiceURL...`)
    
    // Get current template
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('pass_json')
      .eq('id', templateId)
      .single()
    
    if (fetchError) {
      throw new Error(`Failed to fetch template: ${fetchError.message}`)
    }
    
    // Update pass_json with production web service URL
    const updatedPassJson = {
      ...template.pass_json,
      webServiceURL: 'https://walletpush.io/api/passkit/v1',
      authenticationToken: template.pass_json.serialNumber || '{{serialNumber}}'
    }
    
    console.log('📝 Updated pass_json configuration:')
    console.log(`webServiceURL: ${updatedPassJson.webServiceURL}`)
    console.log(`authenticationToken: ${updatedPassJson.authenticationToken}`)
    
    // Update the template
    const { error: updateError } = await supabase
      .from('templates')
      .update({ pass_json: updatedPassJson })
      .eq('id', templateId)
    
    if (updateError) {
      throw new Error(`Failed to update template: ${updateError.message}`)
    }
    
    console.log('✅ Template updated successfully with production webServiceURL!')
    console.log('🚀 Ready for production deployment!')
    
  } catch (error) {
    console.error('❌ Error updating template:', error.message)
    process.exit(1)
  }
}

updateTemplateWebService()
