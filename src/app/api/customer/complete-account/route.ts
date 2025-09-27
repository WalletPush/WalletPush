import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, check if a customer exists with this email but no password set
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .maybeSingle()

    if (customerError) {
      console.error('❌ Error checking existing customer:', customerError)
      return NextResponse.json(
        { error: 'Failed to verify customer' },
        { status: 500 }
      )
    }

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'No customer found with this email. Please contact support.' },
        { status: 404 }
      )
    }

    console.log('✅ Found existing customer:', existingCustomer.email)
    console.log('🔄 Creating Supabase auth user for customer:', email)

    // Create the Supabase auth user - SIMPLE AND DIRECT
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email since we know they have access to it (they got the pass)
      user_metadata: {
        first_name: existingCustomer.first_name,
        last_name: existingCustomer.last_name,
        role: 'customer',
        customer_id: existingCustomer.id
      }
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      console.error('❌ Full auth error details:', JSON.stringify(authError, null, 2))
      return NextResponse.json(
        { error: `Failed to create account: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    console.log('✅ Auth user created successfully:', authUser.user.id)

    // Note: We're not storing auth_user_id in the customer record for now
    // The relationship is managed through email matching
    console.log('✅ Auth user created and linked via email to customer:', existingCustomer.id)

    return NextResponse.json({
      success: true,
      message: 'Account completed successfully',
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        customer_id: existingCustomer.id
      }
    })

  } catch (error) {
    console.error('❌ Complete account API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
