import { NextResponse } from 'next/server'
import { PassTypeIDStore } from '../../../../../lib/pass-type-id-store'

/**
 * POST - Set a Pass Type ID as default
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Set as default using store
    const success = PassTypeIDStore.setDefault(id)
    
    if (!success) {
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
