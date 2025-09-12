import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

// Temporary in-memory store for development
const devTemplates: any[] = [
  {
    id: 'temp-blue-karma-1',
    program_id: 'be023bdf-c668-4cec-ac51-65d3c02ea192',
    version: 1,
    name: 'Blue Karma Loyalty',
    pass_type: 'storeCard',
    description: 'Blue Karma loyalty program template',
    template_json: {
      name: 'Blue Karma Loyalty',
      passStyle: 'storeCard',
      description: 'Blue Karma loyalty program template',
      fields: [],
      images: {},
      colors: {}
    },
    created_at: '2024-01-15T10:00:00Z'
  }
]

export async function GET() {
  // Return development templates for now
  return NextResponse.json({ data: devTemplates, templates: devTemplates })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()

  // Temporarily skip auth for development
  // const { data: { user }, error: userError } = await supabase.auth.getUser()
  // if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Hardcode business ID for development
  const businessId: string = 'be023bdf-c668-4cec-ac51-65d3c02ea191' // Blue Karma business ID

  // Ensure a default program exists for this business
  const defaultProgramName = 'Default Program'
  let programId: string = 'be023bdf-c668-4cec-ac51-65d3c02ea192' // Hardcoded UUID for development
  // Temporarily commented out for development
  /*
  {
    const { data: programs, error: progErr } = await supabase
      .from('programs')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', defaultProgramName)
      .limit(1)
    if (progErr) return NextResponse.json({ error: progErr.message }, { status: 400 })
    if (programs && programs.length > 0) {
      programId = programs[0].id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('programs')
        .insert({ business_id: businessId, name: defaultProgramName })
        .select('id')
        .single()
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })
      programId = created.id
    }
  }
  */

  // For development - just return success and store in memory/local
  const templateJson = body?.template ?? body
  
  // Create a mock template and add to dev store
  const mockTemplate = {
    id: `temp-${Date.now()}`,
    program_id: programId,
    version: 1,
    template_json: templateJson,
    name: templateJson?.name || 'WalletPush Template',
    pass_type: templateJson?.passStyle || 'generic', 
    description: templateJson?.description || 'A wallet pass template',
    created_at: new Date().toISOString()
  }
  
  // Add to development store
  devTemplates.push(mockTemplate)
  
  return NextResponse.json({ template: mockTemplate, message: 'Template saved successfully (development mode)' })
}


