import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Fix template account_id values
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    console.log('🔧 Fixing template account_id values...')

    // Update templates where account_id is null
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    const { data: updatedTemplates, error } = await supabase
      .from('templates')
      .update({ account_id: businessId })
      .is('account_id', null)
      .select('id, account_id')

    if (error) {
      console.error('❌ Failed to update templates:', error)
      return NextResponse.json({ error: 'Failed to update templates', details: error }, { status: 500 })
    }

    console.log(`✅ Updated ${updatedTemplates?.length || 0} templates with account_id: ${businessId}`)

    return NextResponse.json({ 
      success: true,
      message: `Fixed ${updatedTemplates?.length || 0} templates`,
      updatedTemplates: updatedTemplates?.map(t => t.id) || []
    })

  } catch (error) {
    console.error('❌ Template fixing error:', error)
    return NextResponse.json({ 
      error: 'Failed to fix templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
