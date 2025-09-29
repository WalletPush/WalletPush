import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(req.url)
    const preview = url.searchParams.get('preview') === '1' // allow configurator/dev to bypass auth
    const programIdOverride = url.searchParams.get('programId') || null
    let businessId = url.searchParams.get('businessId') || null // dev override only

    // 1) Resolve tenant (business) from host unless overridden
    if (!businessId) {
      const host = (req.headers.get('host') || '').split(':')[0]
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const { data: bizByDomain } = await supabase
          .from('businesses')
          .select('id, custom_domain, slug')
          .or(`custom_domain.eq.${host},slug.eq.${host.split('.')[0]}`)
          .limit(1)
          .maybeSingle()
        businessId = bizByDomain?.id ?? null
      }
    }
    if (!businessId) {
      return NextResponse.json({ error: 'businessId could not be resolved' }, { status: 400 })
    }

    // 2) Bind customer: prefer override → auth metadata customer_id → email lookup
    let customerId = url.searchParams.get('customerId') // dev override only
    if (!customerId && !preview) {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

      // First try: use customer_id from auth user metadata (set during account completion)
      if (user.user_metadata?.customer_id) {
        console.log('🔍 Using customer_id from auth metadata:', user.user_metadata.customer_id)
        customerId = user.user_metadata.customer_id
        
        // Verify this customer exists and belongs to this business
        const { data: customer } = await supabase
          .from('customers')
          .select('id, business_id')
          .eq('id', customerId)
          .eq('business_id', businessId)
          .single()
        
        if (!customer) {
          console.log('⚠️ Auth metadata customer_id invalid, falling back to email lookup')
          customerId = null
        }
      }
      
      // Fallback: lookup by email within this business
      if (!customerId) {
        console.log('🔍 Looking up customer by email:', user.email)
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('business_id', businessId)
          .eq('email', user.email)
          .limit(1)
          .maybeSingle()

        customerId = customer?.id ?? null
      }
    }
    if (!customerId) {
      return NextResponse.json({ error: 'customer not found' }, { status: 404 })
    }

    // 3) Resolve program: override → active program for business (most recent with current_version_id)
    let programId = programIdOverride
    if (!programId) {
      const { data: program } = await supabase
        .from('programs')
        .select('id,current_version_id')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .not('current_version_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      programId = program?.id ?? null
      if (!programId) {
        return NextResponse.json({ error: 'no active program for business' }, { status: 404 })
      }
    }

    // 4) Read program version/spec to know program_type
    const { data: programRow, error: pErr } = await supabase
      .from('programs')
      .select('id,current_version_id')
      .eq('id', programId)
      .single()
    if (pErr || !programRow?.current_version_id) {
      return NextResponse.json({ error: 'program has no published version' }, { status: 409 })
    }

    const { data: version, error: vErr } = await supabase
      .from('program_versions')
      .select('spec_json')
      .eq('id', programRow.current_version_id)
      .single()
    if (vErr || !version?.spec_json) {
      return NextResponse.json({ error: 'program version not found' }, { status: 404 })
    }
    const programType: 'loyalty' | 'membership' | 'store_card' =
      version.spec_json.program_type || 'loyalty'

    // 5) Pull ALL events for accurate balances (optimize later with a SQL view/materialized agg)
    const { data: events, error: evErr } = await supabase
      .from('customer_events')
      .select('type,amounts_json,observed_at,meta_json')
      .eq('customer_id', customerId)
      .eq('program_id', programId)
      .order('observed_at', { ascending: false })

    if (evErr) {
      // Don’t fail the page; return empty with zeros
      return NextResponse.json({
        program_type: programType,
        recent_activity: [],
        points_balance: 0,
        credit_balance: 0,
        stored_value_balance: 0,
      })
    }

    const recent = (events ?? []).slice(0, 20).map((e) => ({
      ts: e.observed_at,
      type: e.type,
      points: e.amounts_json?.points_delta ?? 0,
      credit: e.amounts_json?.credit_delta ?? 0,
      stored_value: e.amounts_json?.stored_value_delta ?? 0,
      meta: e.meta_json ?? {},
    }))

    const sum = (k: 'points_delta' | 'credit_delta' | 'stored_value_delta') => {
      const total = (events ?? []).reduce((acc, e) => acc + (Number(e.amounts_json?.[k]) || 0), 0);
      console.log(`🔍 Customer summary calculation for ${k}:`, {
        events_count: events?.length || 0,
        total,
        sample_events: events?.slice(0, 3).map(e => ({ amounts: e.amounts_json, type: e.type }))
      });
      return total;
    }

    const base: any = { program_type: programType, recent_activity: recent, customer_id: customerId }

    let summary: any
    if (programType === 'membership') {
      summary = { ...base, credit_balance: sum('credit_delta'), allowances: [], next_invoice: null, claimables: [] }
    } else if (programType === 'store_card') {
      summary = { ...base, stored_value_balance: sum('stored_value_delta') }
    } else {
      const points = sum('points_delta')
      
      // Calculate tier based on program spec
      let tier = null
      let points_to_next_tier = null
      
      const tiers = version.spec_json.tiers
      if (tiers && Array.isArray(tiers) && tiers.length > 0) {
        // Sort tiers by points required
        const sortedTiers = [...tiers].sort((a, b) => a.pointsRequired - b.pointsRequired)
        
        // Find current tier (highest tier achieved)
        let currentTier = sortedTiers[0]
        for (const tierConfig of sortedTiers) {
          if (points >= tierConfig.pointsRequired) {
            currentTier = tierConfig
          } else {
            break
          }
        }
        
        // Find next tier
        const nextTier = sortedTiers.find(t => t.pointsRequired > points)
        
        tier = {
          name: currentTier.name,
          threshold: currentTier.pointsRequired
        }
        points_to_next_tier = nextTier ? nextTier.pointsRequired - points : null
      }
      
      summary = { ...base, points_balance: points, tier, points_to_next_tier, claimables: [] }
    }

    console.log('🔍 Customer summary final result:', {
      customerId,
      programId,
      summary: { ...summary, recent_activity: `${summary.recent_activity?.length || 0} events` }
    });

    return NextResponse.json(summary)
  } catch (err) {
    console.error('customer/summary error', err)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}