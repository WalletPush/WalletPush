import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const businessId = searchParams.get('businessId')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Looking up customer by email:', email, 'businessId:', businessId)

    const supabase = await createClient()

    // Look up customer by email - if multiple exist, get the most recent one
    const { data: customers, error: queryError } = await supabase
      .from('customers')
      .select('id, business_id, email, first_name, last_name')
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('❌ Customer lookup query error:', queryError)
      return NextResponse.json({ error: 'Customer lookup failed' }, { status: 500 })
    }

    if (!customers || customers.length === 0) {
      console.error('❌ No customers found for email:', email)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // If multiple customers exist, log them and use the first (most recent)
    if (customers.length > 1) {
      console.log('⚠️ Multiple customers found for email:', email)
      console.log('📋 All customers:', customers.map(c => ({ id: c.id, business_id: c.business_id })))
    }

    const customer = customers[0]
    console.log('✅ Using customer:', { id: customer.id, business_id: customer.business_id })

    const error = null

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
