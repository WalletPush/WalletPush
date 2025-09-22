import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    console.log('🔍 Check account status API called with email:', email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if customer exists in our database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .maybeSingle()

    if (customerError) {
      console.error('❌ Error checking customer:', customerError)
      return NextResponse.json(
        { error: 'Failed to check customer status', details: customerError.message },
        { status: 500 }
      )
    }

    if (!customer) {
      return NextResponse.json({
        exists: false,
        hasPassword: false,
        redirectTo: '/customer/auth/login', // Default fallback
        customerName: null
      })
    }

    // Check if customer has a Supabase auth user (password set)
    let hasPassword = false
    try {
      const { data: listResponse, error: listError } = await supabase.auth.admin.listUsers()
      if (!listError && listResponse?.users) {
        const authUser = listResponse.users.find((user: any) => user.email === email)
        hasPassword = !!authUser
        console.log('🔍 Auth user exists for customer:', hasPassword)
      }
    } catch (error) {
      console.error('❌ Error checking auth user:', error)
      // Assume no password if we can't check
      hasPassword = false
    }

    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    
    // Determine redirect URL
    const redirectTo = hasPassword 
      ? '/customer/auth/login'
      : `/customer/auth/complete-account?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(customer.first_name || '')}&lastName=${encodeURIComponent(customer.last_name || '')}`

    return NextResponse.json({
      exists: true,
      hasPassword,
      redirectTo,
      customerName: customerName || null,
      customerId: customer.id
    })

  } catch (error) {
    console.error('❌ Check account status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
