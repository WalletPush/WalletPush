import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusinessId } from '@/lib/business-context'

// GET /api/business/custom-fields/[id] - Get a specific custom field
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    
    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }

    console.log('🔍 Fetching custom field:', id)

    const { data: customField, error: fieldError } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId) // Security check
      .single()

    if (fieldError) {
      console.error('❌ Error fetching custom field:', fieldError)
      
      if (fieldError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Custom field not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch custom field' },
        { status: 500 }
      )
    }

    console.log('✅ Found custom field:', customField.field_label)

    return NextResponse.json({ 
      data: customField
    })

  } catch (error: any) {
    console.error('❌ Get custom field API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/business/custom-fields/[id] - Update a custom field
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    
    const {
      field_label,
      field_type,
      field_options,
      is_required,
      help_text,
      placeholder_text,
      default_value,
      min_length,
      max_length,
      min_value,
      max_value,
      validation_regex,
      is_visible,
      is_searchable,
      pass_field_mapping
    } = body

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }

    console.log('📝 Updating custom field:', id)

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (field_label !== undefined) updateData.field_label = field_label
    if (field_type !== undefined) updateData.field_type = field_type
    if (field_options !== undefined) updateData.field_options = field_options
    if (is_required !== undefined) updateData.is_required = is_required
    if (help_text !== undefined) updateData.help_text = help_text
    if (placeholder_text !== undefined) updateData.placeholder_text = placeholder_text
    if (default_value !== undefined) updateData.default_value = default_value
    if (min_length !== undefined) updateData.min_length = min_length
    if (max_length !== undefined) updateData.max_length = max_length
    if (min_value !== undefined) updateData.min_value = min_value
    if (max_value !== undefined) updateData.max_value = max_value
    if (validation_regex !== undefined) updateData.validation_regex = validation_regex
    if (is_visible !== undefined) updateData.is_visible = is_visible
    if (is_searchable !== undefined) updateData.is_searchable = is_searchable
    if (pass_field_mapping !== undefined) updateData.pass_field_mapping = pass_field_mapping

    // Validate field_type if provided
    if (field_type) {
      const validTypes = ['text', 'number', 'date', 'select', 'boolean', 'textarea', 'email', 'phone']
      if (!validTypes.includes(field_type)) {
        return NextResponse.json(
          { error: `Invalid field_type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const { data: customField, error: updateError } = await supabase
      .from('custom_fields')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId) // Security check
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating custom field:', updateError)
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Custom field not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to update custom field' },
        { status: 500 }
      )
    }

    console.log('✅ Custom field updated successfully')

    return NextResponse.json({
      success: true,
      data: customField
    })

  } catch (error: any) {
    console.error('❌ Update custom field API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/business/custom-fields/[id] - Delete a custom field
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    
    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }

    console.log('🗑️ Deleting custom field:', id)

    // First, check if the field exists
    const { data: existingField } = await supabase
      .from('custom_fields')
      .select('field_label')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (!existingField) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      )
    }

    // Delete the custom field
    const { error: deleteError } = await supabase
      .from('custom_fields')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId) // Security check

    if (deleteError) {
      console.error('❌ Error deleting custom field:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete custom field' },
        { status: 500 }
      )
    }

    console.log('✅ Custom field deleted successfully:', existingField.field_label)

    return NextResponse.json({
      success: true,
      message: 'Custom field deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Delete custom field API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
