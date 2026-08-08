import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Chainable Supabase mock + a mutable "current user" + captured realtime callback,
// hoisted so the module mocks below can reference them.
const h = vi.hoisted(() => {
  const state = {}
  state.maybeSingle = vi.fn()
  state.upsert = vi.fn(() => Promise.resolve({ error: null }))
  state.from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: state.maybeSingle }) }),
    upsert: state.upsert,
  }))
  state.subscribe = vi.fn(() => ({ topic: 'ch' }))
  state.on = vi.fn((_event, _config, cb) => {
    state.realtimeCb = cb
    return { subscribe: state.subscribe }
  })
  state.channel = vi.fn(() => ({ on: state.on }))
  state.removeChannel = vi.fn()
  state.userRef = { current: null }
  state.supabase = { from: state.from, channel: state.channel, removeChannel: state.removeChannel }
  return state
})

vi.mock('../lib/supabase.js', () => ({ isSupabaseConfigured: true, supabase: h.supabase }))
vi.mock('../context/AuthProvider.jsx', () => ({ useAuth: () => ({ user: h.userRef.current }) }))

import { useCloudSync } from './useCloudSync.js'

function makeSetters() {
  return { setTasks: vi.fn(), setHistory: vi.fn(), setForests: vi.fn() }
}
function slicesOf(values, s) {
  return [
    { key: 'tasks', value: values.tasks, set: s.setTasks },
    { key: 'history', value: values.history, set: s.setHistory },
    { key: 'forests', value: values.forests, set: s.setForests },
  ]
}

beforeEach(() => {
  vi.clearAllMocks()
  h.userRef.current = null
  h.realtimeCb = null
})

describe('useCloudSync', () => {
  it('does nothing when signed out', () => {
    const s = makeSetters()
    renderHook(() => useCloudSync(slicesOf({ tasks: [], history: [], forests: [] }, s)))
    expect(h.from).not.toHaveBeenCalled()
    expect(h.channel).not.toHaveBeenCalled()
    expect(s.setTasks).not.toHaveBeenCalled()
  })

  it('hydrates local state from the user’s row on sign-in', async () => {
    h.userRef.current = { id: 'u1' }
    h.maybeSingle.mockResolvedValue({
      data: { tasks: [{ id: 't1' }], history: [{ ts: 1 }], forests: [{ id: 'f1' }] },
      error: null,
    })
    const s = makeSetters()
    renderHook(() => useCloudSync(slicesOf({ tasks: [], history: [], forests: [] }, s)))

    await waitFor(() => expect(s.setTasks).toHaveBeenCalledWith([{ id: 't1' }]))
    expect(s.setHistory).toHaveBeenCalledWith([{ ts: 1 }])
    expect(s.setForests).toHaveBeenCalledWith([{ id: 'f1' }])
  })

  it('creates an EMPTY row for a first-time user (never uploads leftover local data)', async () => {
    h.userRef.current = { id: 'u2' }
    h.maybeSingle.mockResolvedValue({ data: null, error: null })
    const s = makeSetters()
    renderHook(() => useCloudSync(slicesOf({ tasks: [{ id: 'leftover' }], history: [], forests: [] }, s)))

    await waitFor(() => expect(h.upsert).toHaveBeenCalled())
    expect(s.setTasks).toHaveBeenCalledWith([]) // local reset to empty
    expect(h.upsert.mock.calls[0][0]).toMatchObject({ id: 'u2', tasks: [] })
  })

  it('heals a hydrated slice via its hydrate() transform', async () => {
    h.userRef.current = { id: 'u5' }
    h.maybeSingle.mockResolvedValue({ data: { settings: { focusMin: 40 } }, error: null })
    const setSettings = vi.fn()
    renderHook(() =>
      useCloudSync([
        { key: 'settings', value: {}, set: setSettings, hydrate: (v) => ({ shortMin: 5, ...(v || {}) }) },
      ]),
    )
    await waitFor(() => expect(setSettings).toHaveBeenCalledWith({ shortMin: 5, focusMin: 40 }))
  })

  it('pushes changed state up (debounced) after hydration', async () => {
    h.userRef.current = { id: 'u3' }
    h.maybeSingle.mockResolvedValue({ data: { tasks: [], history: [], forests: [] }, error: null })
    const s = makeSetters()
    const { rerender } = renderHook((values) => useCloudSync(slicesOf(values, s)), {
      initialProps: { tasks: [], history: [], forests: [] },
    })

    await waitFor(() => expect(s.setTasks).toHaveBeenCalled()) // hydrated
    h.upsert.mockClear()

    rerender({ tasks: [{ id: 'new' }], history: [], forests: [] })
    await waitFor(() => expect(h.upsert).toHaveBeenCalled(), { timeout: 2000 })
    expect(h.upsert.mock.calls[0][0]).toMatchObject({ id: 'u3', tasks: [{ id: 'new' }] })
  })

  it('applies live realtime updates from other devices', async () => {
    h.userRef.current = { id: 'u6' }
    h.maybeSingle.mockResolvedValue({ data: { tasks: [], history: [], forests: [] }, error: null })
    const s = makeSetters()
    renderHook(() => useCloudSync(slicesOf({ tasks: [], history: [], forests: [] }, s)))

    await waitFor(() => expect(h.channel).toHaveBeenCalled())
    expect(typeof h.realtimeCb).toBe('function')

    act(() => {
      h.realtimeCb({ new: { tasks: [{ id: 'remote' }], history: [], forests: [] } })
    })
    expect(s.setTasks).toHaveBeenCalledWith([{ id: 'remote' }])
  })

  it('degrades gracefully when the load errors (no crash, no push)', async () => {
    h.userRef.current = { id: 'u4' }
    h.maybeSingle.mockResolvedValue({ data: null, error: { message: 'relation missing' } })
    const s = makeSetters()
    renderHook(() => useCloudSync(slicesOf({ tasks: [], history: [], forests: [] }, s)))

    await waitFor(() => expect(h.maybeSingle).toHaveBeenCalled())
    expect(s.setTasks).not.toHaveBeenCalled()
    expect(h.upsert).not.toHaveBeenCalled()
  })
})
