// Enhanced user types for multi-tenant architecture
export type UserRole = 'agency_owner' | 'agency_admin' | 'business_owner' | 'business_admin' | 'business_staff' | 'end_user'

export type AccountType = 'agency' | 'business' | 'end_user'

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Agency {
  id: string
  name: string
  slug: string
  logo_url?: string
  custom_domain?: string
  white_label_settings: {
    primary_color: string
    secondary_color: string
    logo_url?: string
    favicon_url?: string
    custom_css?: string
  }
  subscription_status: 'active' | 'trial' | 'cancelled' | 'past_due'
  max_businesses: number
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  agency_id?: string // Optional - can be direct or through agency
  name: string
  slug: string
  custom_domain?: string
  logo_url?: string
  contact_email: string
  contact_phone?: string
  address?: {
    street: string
    city: string
    state: string
    country: string
    postal_code: string
  }
  stripe_account_id?: string // Stripe Connect account
  subscription_status: 'active' | 'trial' | 'cancelled' | 'past_due'
  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  user_id: string
  tenant_id: string // agency_id or business_id
  tenant_type: 'agency' | 'business'
  role: UserRole
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface AuthContext {
  user: User | null
  agency?: Agency | null
  business?: Business | null
  role: UserRole | null
  permissions: string[]
  isLoading: boolean
}
