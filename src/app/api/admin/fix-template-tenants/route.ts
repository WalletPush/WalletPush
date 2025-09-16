import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Fix template tenant_id values
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    console.log('🔧 Fixing template tenant_id values...')

    // Update templates where tenant_id is null but account_id exists
    const { data, error } = await supabase
      .from('templates')
      .update({ tenant_id: supabase.rpc('account_id') })
      .is('tenant_id', null)
      .not('account_id', 'is', null)
      .select()

    if (error) {
      console.error('❌ Failed to update templates:', error)
      
      // Try a different approach - get all templates and update them individually
      const { data: templates, error: fetchError } = await supabase
        .from('templates')
        .select('id, account_id, tenant_id')
        .is('tenant_id', null)
        .not('account_id', 'is', null)

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch templates', details: fetchError }, { status: 500 })
      }

      console.log(`📋 Found ${templates?.length || 0} templates to fix`)

      if (templates && templates.length > 0) {
        const updates = []
        for (const template of templates) {
          const { error: updateError } = await supabase
            .from('templates')
            .update({ tenant_id: template.account_id })
            .eq('id', template.id)

          if (updateError) {
            console.error(`❌ Failed to update template ${template.id}:`, updateError)
          } else {
            console.log(`✅ Updated template ${template.id} tenant_id to ${template.account_id}`)
            updates.push(template.id)
          }
        }

        return NextResponse.json({ 
          success: true,
          message: `Fixed ${updates.length} templates`,
          updatedTemplates: updates
        })
      }
    } else {
      console.log(`✅ Updated ${data?.length || 0} templates`)
      return NextResponse.json({ 
        success: true,
        message: `Fixed ${data?.length || 0} templates`,
        updatedTemplates: data?.map(t => t.id) || []
      })
    }

    return NextResponse.json({ success: true, message: 'No templates needed fixing' })

  } catch (error) {
    console.error('❌ Template fixing error:', error)
    return NextResponse.json({ 
      error: 'Failed to fix templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
