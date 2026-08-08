// Supabase client. Configured from Vite env vars (only VITE_* are exposed to the
// browser). The anon key is safe to ship in client code — it's scoped by
// Supabase Row Level Security, not a secret. See .env.example for setup.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once both env vars are present — the app enables auth only then. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** The Supabase client, or null when auth isn't configured (dev/tests). */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'bloom.auth',
      },
    })
  : null
