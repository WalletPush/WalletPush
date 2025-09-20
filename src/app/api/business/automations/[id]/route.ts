import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'

    // Fetch the specific automation
    const { data: automation, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', params.id)
      .eq('business_id', businessId)
      .single()

    if (error) {
      console.error('❌ Error fetching automation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }
    
    return NextResponse.json(automation)
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'

    const body = await request.json()
    const { name, description, trigger_type, trigger_config, conditions, actions, status, template_id } = body

    console.log('🔍 Updating automation:', params.id)
    console.log('📝 Update data:', { name, trigger_type, status, template_id })

    // Prepare update data
    const updateData = {
      name,
      description,
      trigger_type,
      trigger_config: trigger_config || {},
      conditions: conditions || [],
      actions: actions || [],
      status
    }
    
    // Add template_id if provided (field may not exist in all database versions)
    if (template_id) {
      (updateData as any).template_id = template_id
    }

    // Update the automation
    const { data: automation, error } = await supabase
      .from('automations')
      .update(updateData)
      .eq('id', params.id)
      .eq('business_id', businessId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating automation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    console.log('✅ Updated automation:', automation.id)
    
    return NextResponse.json({ automation })
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'

    console.log('🔍 Deleting automation:', params.id)

    // Delete the automation
    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', params.id)
      .eq('business_id', businessId)

    if (error) {
      console.error('❌ Error deleting automation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Deleted automation:', params.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
