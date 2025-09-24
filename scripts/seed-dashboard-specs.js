/**
 * Seed script to add JSON-driven dashboard specs to the database
 * Based on the specifications provided in the conversation
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Seed specs from the conversation specifications
const LOYALTY_SPEC = {
  "version": "1.0",
  "program_type": "loyalty",
  "currency": "USD",
  "earning": { "basis": "spend", "rate_per_currency": 1 },
  "tiers": { 
    "enabled": true, 
    "levels": [ 
      { "name": "Silver", "threshold": 1000 }, 
      { "name": "Gold", "threshold": 3000 } 
    ] 
  },
  "redemption": { 
    "catalog": [ 
      { "id":"free_coffee","title":"Free Coffee","cost_points":100 },
      { "id":"pastry_reward","title":"Free Pastry","cost_points":200 },
      { "id":"lunch_special","title":"Free Lunch","cost_points":500 }
    ] 
  },
  "copy": { 
    "program_name": "Daily Grind Rewards", 
    "tagline": "Sip. Earn. Repeat." 
  },
  "ui_contract": {
    "layout": "loyalty_dashboard_v1",
    "sections": [
      { "type":"balanceHeader",     "props":["member.points_balance","member.tier.name"] },
      { "type":"progressNextTier",  "props":["member.points_to_next_tier","program.tiers.levels"] },
      { "type":"rewardsGrid",       "props":["program.redemption.catalog","member.claimables"] },
      { "type":"offersStrip",       "props":["offers.active"] },
      { "type":"qrCheckInButton",   "props":["business.check_in_endpoint"] },
      { "type":"activityFeed",      "props":["member.recent_activity"] }
    ],
    "kpis": ["points_balance","points_to_next_tier"]
  }
}

const MEMBERSHIP_SPEC = {
  "version": "1.0", 
  "program_type": "membership",
  "billing": { "price_monthly": 47, "currency": "USD", "billing_day": 15 },
  "membership": {
    "allowances": [ 
      { "id":"tasting_flights","label":"Tasting flights / month","qty":2 },
      { "id":"wine_bottles","label":"Free bottles / month","qty":1 }
    ],
    "perks": [ "10% off bottles", "Member-only releases", "VIP events" ]
  },
  "redemption": { 
    "catalog":[ 
      { "id":"reserve_tasting","title":"Reserve tasting","cost_credit":20 },
      { "id":"private_dinner","title":"Private dinner","cost_credit":100 }
    ] 
  },
  "copy": { 
    "program_name":"Founders Wine Club", 
    "tagline":"Sip, discover, repeat." 
  },
  "ui_contract": {
    "layout": "membership_dashboard_v1",
    "sections": [
      { "type":"membershipHeader", "props":["copy.program_name","billing.price_monthly","copy.tagline"] },
      { "type":"renewalCard",      "props":["billing.billing_day","member.next_invoice"] },
      { "type":"allowancesList",   "props":["membership.allowances","member.allowances"] },
      { "type":"creditWallet",     "props":["member.credit_balance","program.redemption.catalog"] },
      { "type":"offersStrip",      "props":["offers.active"] },
      { "type":"qrCheckInButton",  "props":["business.check_in_endpoint"] },
      { "type":"activityFeed",     "props":["member.recent_activity"] }
    ],
    "kpis": ["credit_balance","next_invoice"]
  }
}

const STORE_CARD_SPEC = {
  "version": "1.0",
  "program_type": "store_card",
  "stored_value": { "expiry_days": null },
  "copy": { "program_name":"Gift & Store Card" },
  "ui_contract": {
    "layout": "store_card_dashboard_v1",
    "sections": [
      { "type":"storeCardHeader",  "props":["copy.program_name"] },
      { "type":"balanceCard",      "props":["member.stored_value_balance"] },
      { "type":"redeemGrid",       "props":["program.redemption.catalog"] },
      { "type":"offersStrip",      "props":["offers.active"] },
      { "type":"qrCheckInButton",  "props":["business.check_in_endpoint"] },
      { "type":"activityFeed",     "props":["member.recent_activity"] }
    ],
    "kpis": ["stored_value_balance"]
  }
}

async function seedDashboardSpecs() {
  try {
    console.log('🌱 Starting dashboard specs seeding...')
    
    // Find the Blue Karma business
    const { data: business, error: businessError } = await supabase
      .from('programs')
      .select('id, business_id, name')
      .eq('business_id', 'be023bdf-c668-4cec-ac51-65d3c02ea191')
      .limit(1)
      .single()

    if (businessError || !business) {
      console.error('❌ Error finding Blue Karma business:', businessError)
      return
    }

    console.log('🏢 Found business program:', business.name, business.id)

    // Create program version with loyalty spec for Blue Karma
    const { data: loyaltyVersion, error: loyaltyError } = await supabase
      .from('program_versions')
      .insert({
        program_id: business.id,
        version: 1,
        spec_json: {
          ...LOYALTY_SPEC,
          program_id: business.id
        },
        created_by: business.business_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (loyaltyError) {
      console.error('❌ Error creating loyalty spec:', loyaltyError)
    } else {
      console.log('✅ Created loyalty spec:', loyaltyVersion.id)
      
      // Update program to use this version
      const { error: updateError } = await supabase
        .from('programs')
        .update({ current_version_id: loyaltyVersion.id })
        .eq('id', business.id)
        
      if (updateError) {
        console.error('❌ Error updating program current version:', updateError)
      } else {
        console.log('✅ Updated program to use loyalty spec')
      }
    }

    // Create some sample offers for testing
    const sampleOffers = [
      {
        business_id: business.business_id,
        program_id: business.id,
        title: "Double Points Weekend",
        description: "Get 2x points on all purchases this weekend!",
        cost_type: "free",
        status: "active",
        availability: { audience: "everyone" },
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      },
      {
        business_id: business.business_id,
        program_id: business.id,
        title: "Free Pastry for Gold Members",
        description: "Exclusive offer for our Gold tier members",
        cost_type: "free",
        status: "active",
        availability: { audience: "tier", value: "Gold" },
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }
    ]

    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .insert(sampleOffers)
      .select()

    if (offersError) {
      console.error('❌ Error creating sample offers:', offersError)
    } else {
      console.log('✅ Created sample offers:', offers.length)
    }

    console.log('🎉 Dashboard specs seeding completed!')
    console.log('You can now test the customer dashboard at /customer/dashboard')

  } catch (error) {
    console.error('❌ Error in seeding:', error)
  }
}

// Run the seeding
seedDashboardSpecs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
