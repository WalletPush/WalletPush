import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/program/spec
 * Returns the program specification for a given business
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let businessId = searchParams.get('businessId')
    
    console.log('🧪 Program spec API called')
    
    // If no businessId provided, resolve from domain (like customer/summary does)
    if (!businessId) {
      const host = (request.headers.get('host') || '').split(':')[0]
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const supabase = await createClient()
        const { data: bizByDomain } = await supabase
          .from('businesses')
          .select('id, custom_domain, slug')
          .or(`custom_domain.eq.${host},slug.eq.${host.split('.')[0]}`)
          .limit(1)
          .maybeSingle()
        businessId = bizByDomain?.id ?? null
        console.log('🌐 Resolved businessId from domain:', host, '→', businessId)
      } else {
        // For localhost development, prefer Sambor's business or fallback to first active business
        console.log('🏠 Localhost detected, using development fallback')
        const supabase = await createClient()
        // First try to find Sambor's business (from your logs)
        const samborBusinessId = '75c3013b-36bd-4d87-a684-61a72cda7e02'
        const { data: samborBusiness } = await supabase
          .from('programs')
          .select('business_id, businesses!inner(name)')
          .eq('business_id', samborBusinessId)
          .eq('status', 'active')
          .not('current_version_id', 'is', null)
          .maybeSingle()
        
        if (samborBusiness) {
          businessId = samborBusinessId
          console.log('🔧 Development using Sambor business:', businessId, '(', samborBusiness?.businesses?.name, ')')
        } else {
          // Fallback to any active business
          const { data: devBusiness } = await supabase
            .from('programs')
            .select('business_id, businesses!inner(name)')
            .eq('status', 'active')
            .not('current_version_id', 'is', null)
            .limit(1)
            .maybeSingle()
          businessId = devBusiness?.business_id ?? null
          console.log('🔧 Development fallback business:', businessId, '(', devBusiness?.businesses?.name, ')')
        }
      }
    }
    
    console.log('🔍 Fetching program spec for business:', businessId)
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId could not be resolved from domain' }, { status: 400 })
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
      business_id: businessId,
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