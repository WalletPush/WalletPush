import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/program/offers
 * Returns active offers for a program
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const programId = searchParams.get('programId')
    
    console.log('🎁 Program offers API called')
    console.log('🔍 Fetching offers for program:', programId)
    
    if (!businessId || !programId) {
      return NextResponse.json({ error: 'businessId and programId are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get active offers for this program
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('id, title, description, cost_type, cost_value, availability, limits, starts_at, ends_at')
      .eq('business_id', businessId)
      .eq('program_id', programId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    if (offersError) {
      console.error('❌ Error fetching offers:', offersError)
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }

    // Filter offers by time window
    const now = new Date()
    const activeOffers = (offers || []).filter(offer => {
      if (offer.starts_at && new Date(offer.starts_at) > now) return false
      if (offer.ends_at && new Date(offer.ends_at) < now) return false
      return true
    })

    const response = {
      active: activeOffers.map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        cost_type: offer.cost_type,
        cost_value: offer.cost_value,
        availability: offer.availability || { audience: 'everyone' },
        limits: offer.limits || {}
      }))
    }

    console.log('✅ Found active offers:', activeOffers.length)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error in program offers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}