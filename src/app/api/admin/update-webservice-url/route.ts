import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { templateId, webServiceURL } = await request.json()
    
    if (!templateId || !webServiceURL) {
      return NextResponse.json(
        { error: 'templateId and webServiceURL are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current template
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('pass_json')
      .eq('id', templateId)
      .single()

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Update pass_json with production web service URL
    const updatedPassJson = {
      ...template.pass_json,
      webServiceURL,
      authenticationToken: '{{serialNumber}}'
    }

    // Update the template
    const { error: updateError } = await supabase
      .from('templates')
      .update({ pass_json: updatedPassJson })
      .eq('id', templateId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template updated with production webServiceURL',
      webServiceURL,
      authenticationToken: '{{serialNumber}}'
    })

  } catch (error) {
    console.error('Error updating webServiceURL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
