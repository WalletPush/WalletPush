import { NextRequest, NextResponse } from 'next/server'
import { getCurrentBusinessId } from '@/lib/business-context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId(request)
    
    if (!businessId) {
      return NextResponse.json({ error: 'No business found for current user' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      businessId 
    })

  } catch (error) {
    console.error('❌ Error getting current business ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
