import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

/*
  AuthProvider wraps the app and exposes the current Supabase session plus the
  auth actions the login screen uses. When Supabase isn't configured it stays
  inert (loading:false, user:null) so the app runs open in dev/tests.
*/

const AuthContext = createContext(null)

const NOT_CONFIGURED = { error: new Error('Authentication is not configured yet.') }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // Only "loading" while we actually have a backend to ask about a session.
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return NOT_CONFIGURED
    return supabase.auth.signInWithPassword({ email, password })
  }, [])

  const signUp = useCallback(async (email, password) => {
    if (!supabase) return NOT_CONFIGURED
    return supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!supabase) return NOT_CONFIGURED
    return supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [session, loading, signIn, signUp, signOut, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
