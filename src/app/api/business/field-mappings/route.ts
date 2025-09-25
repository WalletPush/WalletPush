import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusinessId } from '@/lib/business-context'

// GET /api/business/field-mappings - Get field mappings for a business
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const templateId = url.searchParams.get('templateId')
    
    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }
    
    console.log('🔍 Fetching field mappings for business:', businessId, 'templateId:', templateId)

    let query = supabase
      .from('field_mappings')
      .select(`
        *,
        custom_field:custom_fields(field_key, field_label, field_type, applies_to)
      `)
      .eq('business_id', businessId)

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data: mappings, error: mappingsError } = await query

    if (mappingsError) {
      console.error('❌ Error fetching field mappings:', mappingsError)
      return NextResponse.json(
        { error: 'Failed to fetch field mappings' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${mappings?.length || 0} field mappings`)

    return NextResponse.json({ 
      mappings: mappings || [],
      count: mappings?.length || 0 
    })

  } catch (error: any) {
    console.error('❌ Field mappings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/business/field-mappings - Save field mappings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      template_id, 
      pass_field_id, 
      pass_field_key, 
      pass_field_label, 
      custom_field_id, 
      transform_type = 'direct',
      format_pattern = null
    } = body

    if (!template_id || !pass_field_id || !pass_field_label || !custom_field_id) {
      return NextResponse.json(
        { error: 'Missing required fields: template_id, pass_field_id, pass_field_label, custom_field_id' },
        { status: 400 }
      )
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }

    console.log('💾 Creating field mapping:', {
      businessId,
      template_id,
      pass_field_id,
      custom_field_id
    })

    // First, delete existing mapping for this pass field (if any)
    const { error: deleteError } = await supabase
      .from('field_mappings')
      .delete()
      .eq('business_id', businessId)
      .eq('template_id', template_id)
      .eq('pass_field_id', pass_field_id)

    if (deleteError) {
      console.error('❌ Error deleting existing mapping:', deleteError)
      // Continue anyway - might not exist
    }

    // Insert new mapping
    const mappingRecord = {
      business_id: businessId,
      template_id,
      pass_field_id,
      pass_field_key: pass_field_key || pass_field_label.toLowerCase().replace(/\s+/g, '_'),
      pass_field_label,
      custom_field_id,
      transform_type,
      format_pattern,
      is_active: true
    }

    const { data: insertedMapping, error: insertError } = await supabase
      .from('field_mappings')
      .insert(mappingRecord)
      .select()

    if (insertError) {
      console.error('❌ Error inserting field mapping:', insertError)
      return NextResponse.json(
        { error: 'Failed to save field mapping', details: insertError },
        { status: 500 }
      )
    }

    console.log('✅ Field mapping created successfully:', insertedMapping[0])

    return NextResponse.json({
      success: true,
      message: 'Field mapping created successfully',
      mapping: insertedMapping[0]
    })

  } catch (error: any) {
    console.error('❌ Save field mappings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/business/field-mappings - Delete all mappings for a template
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const templateId = url.searchParams.get('templateId')
    const passFieldId = url.searchParams.get('passFieldId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      )
    }

    // For now, use the Blue Karma business ID (in production, get from user context)
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }

    let deleteQuery = supabase
      .from('field_mappings')
      .delete()
      .eq('business_id', businessId)
      .eq('template_id', templateId)

    if (passFieldId) {
      // Delete specific field mapping
      console.log('🗑️ Deleting specific field mapping:', { templateId, passFieldId })
      deleteQuery = deleteQuery.eq('pass_field_id', passFieldId)
    } else {
      // Delete all mappings for template
      console.log('🗑️ Deleting all field mappings for template:', templateId)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('❌ Error deleting field mappings:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete field mappings' },
        { status: 500 }
      )
    }

    console.log('✅ Field mappings deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Field mappings deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Delete field mappings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
