import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'

/**
 * POST - Set a Pass Type ID as default
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createClient()

    // First, unset all current defaults
    await supabase
      .from('pass_type_ids')
      .update({ is_default: false })
      .eq('is_default', true)

    // Set the specified ID as default
    const { data, error } = await supabase
      .from('pass_type_ids')
      .update({ is_default: true })
      .eq('id', id)
      .select()
    
    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pass Type ID not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pass Type ID set as default successfully'
    })

  } catch (error) {
    console.error('Error setting default Pass Type ID:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to set default Pass Type ID' },
      { status: 500 }
    )
  }
}
