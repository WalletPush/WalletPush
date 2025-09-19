import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Validate that ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Delete the template from database
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Template deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Validate that ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get specific template from database
    const { data: template, error } = await supabase
      .from('templates')
      .select(`
        id,
        program_id,
        version,
        template_json,
        passkit_json,
        previews,
        published_at,
        created_at,
        pass_type_identifier,
        programs (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch template' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}
