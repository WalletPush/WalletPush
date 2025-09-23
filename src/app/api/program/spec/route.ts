import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/program/spec
 * Returns the program specification for a given business
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    
    console.log('🧪 Program spec API called')
    console.log('🔍 Fetching program spec for business:', businessId)
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the program for this business
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, modes, currency, current_version_id')
      .eq('business_id', businessId)
      .limit(1)
      .single()

    if (programError || !program) {
      console.error('❌ Error fetching program:', programError)
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Get the current program version spec
    const { data: programVersion, error: versionError } = await supabase
      .from('program_versions')
      .select('spec_json')
      .eq('id', program.current_version_id)
      .limit(1)
      .single()

    if (versionError || !programVersion) {
      console.error('❌ Error fetching program version:', versionError)
      return NextResponse.json({ error: 'Program version not found' }, { status: 404 })
    }

    const response = {
      program_id: program.id,
      program_type: programVersion.spec_json?.program_type || 'loyalty',
      spec: programVersion.spec_json
    }

    console.log('✅ Found program spec:', response.program_type, 'version:', programVersion.spec_json?.version)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error in program spec API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}