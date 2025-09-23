import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to get business ID from authenticated user
async function getBusinessIdFromUser(supabase: any, user: any) {
  // For now, use the hardcoded business ID that we know works
  // TODO: Implement proper multi-tenant lookup once we understand the exact relationship
  const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
  
  console.log('🔍 Using business ID:', businessId, 'for user:', user.email)
  return businessId
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = await getBusinessIdFromUser(supabase, user)
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found for user' }, { status: 404 })
    }

    console.log('🔍 Fetching automations for business:', businessId)

    // Fetch automations for this business
    const { data: automations, error } = await supabase
      .from('automations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching automations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Found', automations?.length || 0, 'automations')
    
    return NextResponse.json({ automations: automations || [] })
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = await getBusinessIdFromUser(supabase, user)
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found for user' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, trigger_type, trigger_config, actions, template_id, status } = body

    console.log('🔍 Creating automation for business:', businessId)
    console.log('📝 Automation data:', { name, trigger_type, actions, template_id, status })

    // Create the automation
    const insertData = {
      business_id: businessId,
      name,
      description: description || null,
      trigger_type,
      trigger_config: trigger_config || {},
      actions: actions || [],
      status: status || 'draft'
    }
    
    // Add template_id if provided (field may not exist in all database versions)
    if (template_id) {
      (insertData as any).template_id = template_id
    }
    
    const { data: automation, error } = await supabase
      .from('automations')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating automation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Created automation:', automation.id)
    
    return NextResponse.json({ automation })
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
