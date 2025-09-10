import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for Supabase
export type Database = {
  public: {
    Tables: {
      // Add your table types here when you create them
      profiles: {
        Row: {
          id: string
          email: string
          wallet_address?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          wallet_address?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          wallet_address?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
