import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting GET /api/agency/pass-type-assignments')
    const supabase = await createClient()
    
    // Get authenticated user
    console.log('🔐 Getting authenticated user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('❌ User auth error:', userError)
      return NextResponse.json({ error: `Auth error: ${userError.message}` }, { status: 401 })
    }
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    // Get agency account ID
    console.log('🏢 Getting agency account...')
    const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
    if (agencyError) {
      console.error('❌ Agency error:', agencyError)
      return NextResponse.json({ error: `Agency error: ${agencyError.message}` }, { status: 500 })
    }
    if (!agencyAccountId) {
      console.error('❌ No agency account ID returned')
      return NextResponse.json({ error: 'Agency account not found' }, { status: 404 })
    }
    console.log('✅ Agency account ID:', agencyAccountId)

    // Get all Global Pass Type IDs (they can be used by any agency)
    console.log('🎫 Fetching Global Pass Type IDs...')
    const { data: passTypeIds, error: passTypeError } = await supabase
      .from('pass_type_ids')
      .select('id, label, pass_type_identifier, is_global')
      .eq('is_global', true)

    if (passTypeError) {
      console.error('❌ Pass Type IDs error:', passTypeError)
      return NextResponse.json({ error: `Failed to fetch Pass Type IDs: ${passTypeError.message}` }, { status: 500 })
    }

    console.log('✅ Pass Type IDs found:', passTypeIds?.length || 0)
    console.log('📋 Pass Type IDs data:', passTypeIds)

    return NextResponse.json({ passTypeIds })

  } catch (error: any) {
    console.error('💥 CRITICAL API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting POST /api/agency/pass-type-assignments')
    const supabase = await createClient()
    
    // Get authenticated user
    console.log('🔐 Getting authenticated user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('❌ User auth error:', userError)
      return NextResponse.json({ error: `Auth error: ${userError.message}` }, { status: 401 })
    }
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    // Get agency account ID
    console.log('🏢 Getting agency account...')
    const { data: agencyAccountId, error: agencyError } = await supabase.rpc('get_or_create_agency_account')
    if (agencyError) {
      console.error('❌ Agency error:', agencyError)
      return NextResponse.json({ error: `Agency error: ${agencyError.message}` }, { status: 500 })
    }
    if (!agencyAccountId) {
      console.error('❌ No agency account ID returned')
      return NextResponse.json({ error: 'Agency account not found' }, { status: 404 })
    }
    console.log('✅ Agency account ID:', agencyAccountId)

    const { action, businessId, passTypeId } = await request.json()
    console.log('📋 Request data:', { action, businessId, passTypeId })

    if (action === 'assign') {
      console.log('➕ Processing ASSIGN action...')
      // Check if this Pass Type ID is already assigned (unless it's global)
      const { data: passTypeInfo, error: passTypeError } = await supabase
        .from('pass_type_ids')
        .select('is_global')
        .eq('id', passTypeId)
        .single()

      if (passTypeError) {
        return NextResponse.json({ error: `Pass Type ID not found: ${passTypeError.message}` }, { status: 404 })
      }

      // If not global, check if already assigned
      if (!passTypeInfo.is_global) {
        const { data: existingAssignment, error: checkError } = await supabase
          .from('pass_type_assignments')
          .select('business_account_id')
          .eq('pass_type_id', passTypeId)
          .maybeSingle()

        if (checkError) {
          return NextResponse.json({ error: `Assignment check failed: ${checkError.message}` }, { status: 500 })
        }

        if (existingAssignment) {
          return NextResponse.json({ error: 'This Pass Type ID is already assigned to another business' }, { status: 400 })
        }
      }

      // Remove any existing assignment for this business first
      const { error: deleteError } = await supabase
        .from('pass_type_assignments')
        .delete()
        .eq('business_account_id', businessId)

      if (deleteError) {
        return NextResponse.json({ error: `Failed to remove existing assignment: ${deleteError.message}` }, { status: 500 })
      }

      // Use the agency account ID we already have - it's the correct one for the foreign key
      console.log('✅ Using agency account ID for assignment:', agencyAccountId)

      // Create new assignment
      console.log('💾 Creating assignment...')
      const { error: assignError } = await supabase
        .from('pass_type_assignments')
        .insert({
          pass_type_id: passTypeId,
          business_account_id: businessId,
          assigned_by_user_id: user.id,
          assigned_by_account_id: agencyAccountId
        })

      if (assignError) {
        console.error('❌ Assignment error:', assignError)
        return NextResponse.json({ error: `Assignment failed: ${assignError.message}` }, { status: 500 })
      }

      console.log('✅ Assignment created successfully!')
      return NextResponse.json({ success: true, message: 'Pass Type ID assigned successfully' })

    } else if (action === 'unassign') {
      console.log('➖ Processing UNASSIGN action...')
      
      // First check what assignments exist for this business
      console.log('🔍 Checking existing assignments for business:', businessId)
      const { data: existingAssignments, error: checkError } = await supabase
        .from('pass_type_assignments')
        .select('*')
        .eq('business_account_id', businessId)
      
      if (checkError) {
        console.error('❌ Error checking assignments:', checkError)
        return NextResponse.json({ error: `Check failed: ${checkError.message}` }, { status: 500 })
      }
      
      console.log('📋 Existing assignments:', existingAssignments)
      
      // Remove assignment
      console.log('🗑️ Deleting assignment for business:', businessId)
      const { error: unassignError } = await supabase
        .from('pass_type_assignments')
        .delete()
        .eq('business_account_id', businessId)

      if (unassignError) {
        console.error('❌ Unassignment error:', unassignError)
        return NextResponse.json({ error: `Unassignment failed: ${unassignError.message}` }, { status: 500 })
      }

      console.log('✅ Assignment deleted successfully')
      return NextResponse.json({ success: true, message: 'Pass Type ID unassigned successfully' })

    } else {
      console.error('❌ Invalid action:', action)
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('💥 CRITICAL POST API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
