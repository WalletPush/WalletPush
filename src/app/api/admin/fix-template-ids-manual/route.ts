import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Manually fix template IDs with known business ID
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191' // Known business ID
    
    console.log('🔧 Manually fixing template tenant_id and account_id values...')

    // Get all templates that need fixing
    const { data: templates, error: fetchError } = await supabase
      .from('templates')
      .select('id, template_json')
      .or('tenant_id.is.null,account_id.is.null')

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch templates', details: fetchError }, { status: 500 })
    }

    console.log(`📋 Found ${templates?.length || 0} templates to fix`)

    if (templates && templates.length > 0) {
      const updates = []
      for (const template of templates) {
        const { error: updateError } = await supabase
          .from('templates')
          .update({ 
            tenant_id: businessId,
            account_id: businessId 
          })
          .eq('id', template.id)

        if (updateError) {
          console.error(`❌ Failed to update template ${template.id}:`, updateError)
        } else {
          console.log(`✅ Updated template ${template.id} with business ID ${businessId}`)
          updates.push(template.id)
        }
      }

      return NextResponse.json({ 
        success: true,
        message: `Fixed ${updates.length} templates`,
        updatedTemplates: updates,
        businessId: businessId
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
