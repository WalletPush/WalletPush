import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Looking up customer by email:', email)

    const supabase = await createClient()

    // Look up customer by email to get their business_id
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, business_id, email, first_name, last_name')
      .eq('email', email)
      .single()

    if (error) {
      console.error('❌ Customer lookup error:', error)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer) {
      console.error('❌ No customer found for email:', email)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    console.log('✅ Customer found:', { 
      id: customer.id, 
      business_id: customer.business_id, 
      name: `${customer.first_name} ${customer.last_name}` 
    })

    return NextResponse.json({
      customer_id: customer.id,
      business_id: customer.business_id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`
    })

  } catch (error) {
    console.error('❌ Customer lookup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
