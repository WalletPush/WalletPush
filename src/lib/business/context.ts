import { createClient as createSrv } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ROOT_DOMAIN  = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'walletpush.io'

const srv = createSrv(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

export async function businessIdBySlug(slug: string) {
  const { data, error } = await srv
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.id as string | undefined
}

export async function activeCustomDomain(businessId: string) {
  const { data, error } = await srv
    .from('custom_domains')
    .select('domain,status')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.domain as string | undefined
}

export function dashboardUrlFor(businessId: string, slug: string, customDomain?: string) {
  if (customDomain) {
    return `https://${customDomain}/business/dashboard`
  }
  return `https://${ROOT_DOMAIN}/business/${slug}/dashboard`
}
