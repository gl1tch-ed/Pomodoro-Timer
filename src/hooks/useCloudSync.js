import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { useAuth } from '../context/AuthProvider.jsx'

/*
  useCloudSync mirrors a set of state "slices" to Supabase, per user.

  slices: [{ key, value, set, hydrate? }]
    - key      column in public.user_state (jsonb)
    - value    current local value (used for change detection + upload)
    - set      setter to apply a value coming from the cloud
    - hydrate  optional transform for an incoming value (e.g. heal settings from
               defaults); arrays fall back to [] when absent.

  Behavior:
    - Signed out / not configured → inert (localStorage-only; tests unaffected).
    - On sign-in → load the row and REPLACE local state (remote is authoritative,
      which also stops one account's leftover localStorage leaking into another).
      A first-time user gets an empty row (never uploads leftover local data).
    - On local change → debounced upsert. Last write wins.
    - Realtime → other devices' saves stream in live and update local state,
      with our own echoes filtered out.
*/

const TABLE = 'user_state'
const DEBOUNCE_MS = 800

function fallbackFor(slice) {
  return slice.hydrate ? slice.hydrate(undefined) : []
}
function hydrateValue(slice, raw) {
  return slice.hydrate ? slice.hydrate(raw) : raw ?? []
}

export function useCloudSync(slices) {
  const { user } = useAuth()
  const userId = isSupabaseConfigured && user ? user.id : null

  // slices change identity every render; keep the latest in a ref so the
  // subscription/effects don't need it as a dependency.
  const slicesRef = useRef(slices)
  slicesRef.current = slices

  const hydratedRef = useRef(false)
  const lastSyncedRef = useRef(null) // canonical JSON of the last state we loaded/saved
  const timerRef = useRef(null)

  const columns = slices.map((s) => s.key)
  // Canonical snapshot in a fixed column order (used for change/echo detection).
  const snapshotOf = (obj) => JSON.stringify(Object.fromEntries(columns.map((k) => [k, obj[k]])))
  const currentSnapshot = snapshotOf(Object.fromEntries(slices.map((s) => [s.key, s.value])))

  // ---- Load + subscribe whenever the signed-in user changes ----
  useEffect(() => {
    if (!supabase || !userId) {
      hydratedRef.current = false
      lastSyncedRef.current = null
      return
    }
    let active = true
    hydratedRef.current = false

    const applyRow = (row) => {
      const applied = {}
      for (const s of slicesRef.current) {
        applied[s.key] = row ? hydrateValue(s, row[s.key]) : fallbackFor(s)
      }
      // Set lastSynced BEFORE applying so the resulting re-render doesn't re-upload.
      lastSyncedRef.current = snapshotOf(applied)
      for (const s of slicesRef.current) s.set(applied[s.key])
      return applied
    }

    ;(async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(columns.join(', '))
        .eq('id', userId)
        .maybeSingle()
      if (!active) return
      if (error) {
        console.error('[cloud-sync] load failed:', error.message)
        return
      }

      const applied = applyRow(data || null)
      hydratedRef.current = true

      // First login for this account → create the row so later saves can update it.
      if (!data) {
        const { error: initError } = await supabase
          .from(TABLE)
          .upsert({ id: userId, ...applied, updated_at: new Date().toISOString() })
        if (initError) console.error('[cloud-sync] init failed:', initError.message)
      }
    })()

    // Live updates from this user's other devices/tabs.
    const channel = supabase
      .channel(`user_state:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${userId}` },
        (payload) => {
          if (!active) return
          const row = payload.new
          if (!row) return
          const applied = {}
          for (const s of slicesRef.current) applied[s.key] = hydrateValue(s, row[s.key])
          const incoming = snapshotOf(applied)
          if (incoming === lastSyncedRef.current) return // our own echo — ignore
          lastSyncedRef.current = incoming
          for (const s of slicesRef.current) s.set(applied[s.key])
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  // ---- Push local changes (debounced) once hydrated ----
  useEffect(() => {
    if (!supabase || !userId || !hydratedRef.current) return
    if (currentSnapshot === lastSyncedRef.current) return // nothing actually changed

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const payload = { id: userId, updated_at: new Date().toISOString() }
      for (const s of slicesRef.current) payload[s.key] = s.value
      const { error } = await supabase.from(TABLE).upsert(payload)
      if (error) console.error('[cloud-sync] save failed:', error.message)
      else lastSyncedRef.current = currentSnapshot
    }, DEBOUNCE_MS)

    return () => clearTimeout(timerRef.current)
  }, [currentSnapshot, userId])
}
