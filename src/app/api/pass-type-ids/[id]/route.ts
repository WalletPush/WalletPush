import { NextResponse } from 'next/server'
import { PassTypeIDStore } from '../../../../lib/pass-type-id-store'

/**
 * DELETE - Remove a Pass Type ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Remove from store
    const removed = PassTypeIDStore.remove(id)
    
    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Pass Type ID not found' },
        { status: 404 }
      )
    }

    // In production, you would also:
    // 1. Delete the certificate file from secure storage
    // 2. Update database records
    // 3. Check if any passes are using this certificate

    return NextResponse.json({
      success: true,
      message: 'Pass Type ID deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting Pass Type ID:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete Pass Type ID' },
      { status: 500 }
    )
  }
}
