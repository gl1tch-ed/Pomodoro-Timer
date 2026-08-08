// Shared helpers for component/store tests.
import { render } from '@testing-library/react'
import { AppStoreProvider } from '../src/context/AppStore.jsx'
import { AuthProvider } from '../src/context/AuthProvider.jsx'

const KEYS = {
  settings: 'pomodoro.settings',
  tasks: 'pomodoro.tasks',
  history: 'pomodoro.history',
  forests: 'pomodoro.forests',
  activeTask: 'pomodoro.activeTask',
}

/**
 * Seed the persisted slices BEFORE rendering, so the store hydrates from them.
 * Only the keys you pass are written; omit a key to leave it at its default.
 */
export function seedStorage({ settings, tasks, history, forests, activeTask } = {}) {
  if (settings !== undefined) localStorage.setItem(KEYS.settings, JSON.stringify(settings))
  if (tasks !== undefined) localStorage.setItem(KEYS.tasks, JSON.stringify(tasks))
  if (history !== undefined) localStorage.setItem(KEYS.history, JSON.stringify(history))
  if (forests !== undefined) localStorage.setItem(KEYS.forests, JSON.stringify(forests))
  if (activeTask !== undefined) localStorage.setItem(KEYS.activeTask, JSON.stringify(activeTask))
}

/** A provider wrapper usable as renderHook's `wrapper` option.
 *  AuthProvider is inert without Supabase env vars, so cloud sync stays off. */
export function StoreWrapper({ children }) {
  return (
    <AuthProvider>
      <AppStoreProvider>{children}</AppStoreProvider>
    </AuthProvider>
  )
}

/** render() a component tree already wrapped in the Auth + AppStore providers. */
export function renderWithStore(ui, options) {
  return render(
    <AuthProvider>
      <AppStoreProvider>{ui}</AppStoreProvider>
    </AuthProvider>,
    options,
  )
}
