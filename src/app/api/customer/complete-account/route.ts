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

    // Check if this email already has a Supabase auth user
    const { data: listResponse, error: listError } = await supabase.auth.admin.listUsers()
    const existingUser = listResponse?.users?.find((user: any) => user.email === email)
    
    if (existingUser) {
      console.log('⚠️ Auth user already exists for:', email, '- attempting to verify password')
      
      // If auth user exists, try to verify the password they provided
      // This handles the case where account creation succeeded but the frontend got an error
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (!signInError && signInData.user) {
          console.log('✅ Password verified for existing auth user:', email)
          return NextResponse.json({
            success: true,
            message: 'Account already exists and password verified',
            user: {
              id: signInData.user.id,
              email: signInData.user.email,
              customer_id: existingCustomer.id
            }
          })
        } else {
          console.log('❌ Password verification failed for existing auth user:', signInError?.message)
          return NextResponse.json(
            { error: 'This email already has an account with a different password. Please sign in or reset your password.' },
            { status: 409 }
          )
        }
      } catch (verifyError) {
        console.error('❌ Error verifying existing auth user:', verifyError)
        return NextResponse.json(
          { error: 'This email is already associated with your pass. Please sign in instead.' },
          { status: 409 }
        )
      }
    }

    console.log('✅ No auth user found, proceeding to create auth user for existing customer:', email)

    console.log('🔄 Creating Supabase auth user for customer:', email)

    // Create the Supabase auth user
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
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
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
