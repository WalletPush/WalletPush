import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Looking up business by user email:', email)

    const supabase = await createClient()

    // Look up business by user email in account_members
    const { data: membership, error } = await supabase
      .from('account_members')
      .select('account_id, role')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (error) {
      console.error('❌ Business lookup error:', error)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!membership) {
      console.error('❌ No business membership found for user:', email)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    console.log('✅ Business found:', { 
      business_id: membership.account_id, 
      role: membership.role 
    })

    return NextResponse.json({
      business_id: membership.account_id,
      role: membership.role
    })

  } catch (error) {
    console.error('❌ Business lookup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
