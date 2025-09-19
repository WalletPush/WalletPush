import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/business/custom-fields - Fetch custom fields for a business
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const appliesTo = url.searchParams.get('applies_to') // customer, member, pass
    
    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'
    
    console.log('🔍 Fetching custom fields for business:', businessId, 'applies_to:', appliesTo)

    // Build query
    let query = supabase
      .from('custom_fields')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    // Filter by applies_to if specified
    if (appliesTo) {
      query = query.eq('applies_to', appliesTo)
    }

    const { data: customFields, error: fieldsError } = await query

    if (fieldsError) {
      console.error('❌ Error fetching custom fields:', fieldsError)
      return NextResponse.json(
        { error: 'Failed to fetch custom fields' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${customFields?.length || 0} custom fields`)

    return NextResponse.json({ 
      data: customFields,
      count: customFields?.length || 0 
    })

  } catch (error: any) {
    console.error('❌ Custom fields API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/business/custom-fields - Create a new custom field
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      field_key,
      field_label,
      field_type,
      field_options = [],
      applies_to,
      is_required = false,
      help_text,
      placeholder_text,
      default_value,
      min_length,
      max_length,
      min_value,
      max_value,
      validation_regex,
      is_searchable = false,
      pass_field_mapping = {}
    } = body

    // Generate field_key from field_label if not provided
    let finalFieldKey = field_key
    if (!finalFieldKey && field_label) {
      finalFieldKey = field_label.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50) // Limit length
    }

    // Validation
    if (!finalFieldKey || !field_label || !field_type || !applies_to) {
      return NextResponse.json(
        { error: 'Missing required fields: field_label, field_type, applies_to' },
        { status: 400 }
      )
    }

    // Validate field_type
    const validTypes = ['text', 'number', 'date', 'select', 'boolean', 'textarea', 'email', 'phone']
    if (!validTypes.includes(field_type)) {
      return NextResponse.json(
        { error: `Invalid field_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate applies_to
    const validAppliesTo = ['customer', 'member', 'pass']
    if (!validAppliesTo.includes(applies_to)) {
      return NextResponse.json(
        { error: `Invalid applies_to. Must be one of: ${validAppliesTo.join(', ')}` },
        { status: 400 }
      )
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'

    console.log('📝 Creating custom field:', {
      businessId,
      field_key: finalFieldKey,
      field_label,
      field_type,
      applies_to
    })

    // Get the next sort order
    const { data: lastField } = await supabase
      .from('custom_fields')
      .select('sort_order')
      .eq('business_id', businessId)
      .eq('applies_to', applies_to)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (lastField?.sort_order || 0) + 1

    // Insert the custom field
    const { data: customField, error: insertError } = await supabase
      .from('custom_fields')
      .insert({
        business_id: businessId,
        field_key: finalFieldKey,
        field_label,
        field_type,
        field_options,
        applies_to,
        is_required,
        help_text,
        placeholder_text,
        default_value,
        min_length,
        max_length,
        min_value,
        max_value,
        validation_regex,
        is_searchable,
        pass_field_mapping,
        sort_order: nextSortOrder
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating custom field:', insertError)
      
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A custom field with this key already exists for this business and entity type' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create custom field' },
        { status: 500 }
      )
    }

    console.log('✅ Custom field created successfully:', customField.id)

    return NextResponse.json({
      success: true,
      data: customField
    })

  } catch (error: any) {
    console.error('❌ Create custom field API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/business/custom-fields - Update custom field sort order (bulk)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fields } = body // Array of {id, sort_order}

    if (!Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'fields must be an array of {id, sort_order}' },
        { status: 400 }
      )
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = 'be023bdf-c668-4cec-ac51-65d3c02ea191'

    console.log('🔄 Updating sort order for', fields.length, 'custom fields')

    // Update each field's sort order
    const updatePromises = fields.map(({ id, sort_order }) =>
      supabase
        .from('custom_fields')
        .update({ sort_order })
        .eq('id', id)
        .eq('business_id', businessId) // Security check
    )

    await Promise.all(updatePromises)

    console.log('✅ Custom field sort order updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Sort order updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Update custom field sort order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
