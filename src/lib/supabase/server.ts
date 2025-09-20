import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing:', {
      NODE_ENV: process.env.NODE_ENV,
      availableEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    })
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
