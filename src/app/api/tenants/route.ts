import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching tenant info for user:', user.id, user.email)

    // EMERGENCY FIX: Simple tenant lookup/creation
    // Try to find existing tenant owned by this user
    const { data: existingTenant, error: findError } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (existingTenant) {
      console.log('✅ Found existing tenant:', existingTenant.name)
      return NextResponse.json({
        currentTenant: {
          id: existingTenant.id,
          name: existingTenant.name,
          role: 'owner',
          ...existingTenant
        },
        tenants: [{
          id: existingTenant.id,
          name: existingTenant.name,
          role: 'owner',
          ...existingTenant
        }]
      })
    }

    // Create a default tenant for the user
    console.log('🏗️ Creating default tenant for user:', user.email)
    const defaultTenantName = user.email?.split('@')[0] || 'My Business'
    
    const { data: newTenant, error: createTenantError } = await supabase
      .from('tenants')
      .insert({
        name: defaultTenantName,
        owner_id: user.id,
        settings: {},
        active: true
      })
      .select()
      .single()

    if (createTenantError) {
      console.error('❌ Error creating tenant:', createTenantError)
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
    }

    console.log('✅ Created new tenant:', newTenant.name)

    return NextResponse.json({
      currentTenant: {
        id: newTenant.id,
        name: newTenant.name,
        role: 'owner',
        ...newTenant
      },
      tenants: [{
        id: newTenant.id,
        name: newTenant.name,
        role: 'owner',
        ...newTenant
      }]
    })

  } catch (error) {
    console.error('❌ Tenant API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}