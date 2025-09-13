import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all assignments (for agency dashboard)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching Pass Type ID assignments for user:', user.email)

    // Get all assignments the user can see (based on RLS)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('pass_type_assignments')
      .select(`
        id,
        created_at,
        pass_type_ids!inner (
          id,
          label,
          pass_type_identifier,
          is_global
        ),
        business_accounts:accounts!business_account_id (
          id,
          name,
          type
        ),
        assigned_by_accounts:accounts!assigned_by_account_id (
          id,
          name,
          type
        ),
        assigned_by:auth.users!assigned_by_user_id (
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    console.log(`✅ Found ${assignments?.length || 0} Pass Type ID assignments`)

    return NextResponse.json({
      assignments: assignments || []
    })

  } catch (error) {
    console.error('❌ Assignments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new assignment (agency assigns Pass Type ID to business)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pass_type_id, business_account_id, assigned_by_account_id } = await request.json()

    if (!pass_type_id || !business_account_id || !assigned_by_account_id) {
      return NextResponse.json({ 
        error: 'pass_type_id, business_account_id, and assigned_by_account_id are required' 
      }, { status: 400 })
    }

    console.log('📋 Creating Pass Type ID assignment:', {
      pass_type_id,
      business_account_id,
      assigned_by_account_id,
      user: user.email
    })

    // Create the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('pass_type_assignments')
      .insert({
        pass_type_id,
        business_account_id,
        assigned_by_user_id: user.id,
        assigned_by_account_id
      })
      .select(`
        id,
        created_at,
        pass_type_ids!inner (
          id,
          label,
          pass_type_identifier
        ),
        business_accounts:accounts!business_account_id (
          id,
          name
        )
      `)
      .single()

    if (assignmentError) {
      console.error('❌ Error creating assignment:', assignmentError)
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }

    console.log('✅ Successfully created Pass Type ID assignment')

    return NextResponse.json({
      success: true,
      assignment
    })

  } catch (error) {
    console.error('❌ Assignment creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignment_id } = await request.json()

    if (!assignment_id) {
      return NextResponse.json({ error: 'assignment_id is required' }, { status: 400 })
    }

    console.log('🗑️ Removing Pass Type ID assignment:', assignment_id)

    // Delete the assignment (RLS will ensure user has permission)
    const { error: deleteError } = await supabase
      .from('pass_type_assignments')
      .delete()
      .eq('id', assignment_id)

    if (deleteError) {
      console.error('❌ Error deleting assignment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    console.log('✅ Successfully removed Pass Type ID assignment')

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('❌ Assignment deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
