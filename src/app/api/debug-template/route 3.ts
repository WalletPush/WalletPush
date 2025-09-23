import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 Debug template lookup')
    console.log('Has SUPABASE_URL:', hasUrl)
    console.log('Has SERVICE_ROLE_KEY:', hasServiceKey)
    
    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl,
        hasServiceKey
      })
    }
    
    // Try direct Supabase query
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const templateId = '7c252dcb-81e6-4850-857b-9b071f33ceb1'
    
    const { data: template, error } = await supabase
      .from('templates')
      .select('id, template_json, passkit_json, account_id')
      .eq('id', templateId)
      .single()
    
    return NextResponse.json({
      templateId,
      found: !!template,
      error: error?.message || null,
      template: template ? {
        id: template.id,
        account_id: template.account_id,
        hasTemplateJson: !!template.template_json,
        hasPasskitJson: !!template.passkit_json
      } : null
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
