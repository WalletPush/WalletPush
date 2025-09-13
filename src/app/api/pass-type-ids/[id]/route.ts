import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🗑️ Deleting Pass Type ID: ${params.id}`)
    
    const supabase = await createClient()
    
    // First check if this is a global Pass Type ID
    const { data: passTypeId, error: fetchError } = await supabase
      .from('pass_type_ids')
      .select('is_global, label')
      .eq('id', params.id)
      .single()
    
    if (fetchError) {
      console.error('❌ Database fetch failed:', fetchError)
      return NextResponse.json({ 
        error: `Pass Type ID not found: ${fetchError.message}` 
      }, { status: 404 })
    }
    
    // Prevent deletion of global Pass Type IDs
    if (passTypeId?.is_global) {
      console.log('🚫 Attempted to delete global Pass Type ID - blocked')
      return NextResponse.json({ 
        error: 'Global Pass Type IDs cannot be deleted. This is a system-wide certificate used by all accounts.' 
      }, { status: 403 })
    }
    
    // Delete from database (only business Pass Type IDs)
    const { error } = await supabase
      .from('pass_type_ids')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      console.error('❌ Database delete failed:', error)
      return NextResponse.json({ 
        error: `Failed to delete: ${error.message}` 
      }, { status: 500 })
    }
    
    console.log('✅ Pass Type ID deleted from database successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Pass Type ID deleted successfully'
    })
    
  } catch (error: any) {
    console.error('❌ Delete operation failed:', error)
    return NextResponse.json({ 
      error: `Failed to delete: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
}