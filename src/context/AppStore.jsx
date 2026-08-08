import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { useCloudSync } from '../hooks/useCloudSync.js'
import { buildForest } from '../utils/forest.js'
import { PLOT_CAPACITY, LEVEL_HUES } from '../utils/world.js'

/*
  AppStore centralizes the persisted slices of app state:
    - settings  (interval durations, auto-start, notifications)
    - tasks     (the task list)
    - history   (completed focus sessions, feeds statistics)
    - forests   (one full plot per level, each pinned to a country)
  plus the action helpers components use to mutate them.
*/

export const DEFAULT_SETTINGS = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4, // long break after every N focus sessions
  autoStartBreaks: false,
  autoStartFocus: false,
  notifications: false,
}

const STORAGE_KEYS = {
  settings: 'pomodoro.settings',
  tasks: 'pomodoro.tasks',
  history: 'pomodoro.history',
  forests: 'pomodoro.forests',
}

const AppStoreContext = createContext(null)

let idSeed = 0
function makeId() {
  idSeed += 1
  return `${Date.now().toString(36)}-${idSeed}`
}

export function AppStoreProvider({ children }) {
  const [settings, setSettingsRaw] = useLocalStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  const [tasks, setTasks] = useLocalStorage(STORAGE_KEYS.tasks, [])
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.history, [])
  const [forests, setForests] = useLocalStorage(STORAGE_KEYS.forests, [])

  // Mirror the per-user slices to Supabase (inert when signed out / unconfigured).
  // Settings are healed from defaults when they arrive from the cloud.
  useCloudSync([
    { key: 'tasks', value: tasks, set: setTasks },
    { key: 'history', value: history, set: setHistory },
    { key: 'forests', value: forests, set: setForests },
    {
      key: 'settings',
      value: settings,
      set: setSettingsRaw,
      hydrate: (v) => ({ ...DEFAULT_SETTINGS, ...(v || {}) }),
    },
  ])

  // Merge patch into settings (and heal any missing keys from defaults).
  const updateSettings = useCallback(
    (patch) => {
      setSettingsRaw((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }))
    },
    [setSettingsRaw],
  )

  const resetSettings = useCallback(() => {
    setSettingsRaw((prev) => ({
      ...DEFAULT_SETTINGS,
      // keep the user's notification preference across a "reset defaults"
      notifications: prev.notifications,
    }))
  }, [setSettingsRaw])

  // ---- Task actions ----
  const addTask = useCallback(
    (title, estimate = 1) => {
      const trimmed = title.trim()
      if (!trimmed) return
      setTasks((prev) => [
        ...prev,
        {
          id: makeId(),
          title: trimmed,
          estimate: Math.max(1, estimate | 0),
          completedPomos: 0,
          done: false,
        },
      ])
    },
    [setTasks],
  )

  const updateTask = useCallback(
    (id, patch) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    },
    [setTasks],
  )

  const removeTask = useCallback(
    (id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
    },
    [setTasks],
  )

  const moveTask = useCallback(
    (id, dir) => {
      setTasks((prev) => {
        const i = prev.findIndex((t) => t.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= prev.length) return prev
        const next = prev.slice()
        ;[next[i], next[j]] = [next[j], next[i]]
        return next
      })
    },
    [setTasks],
  )

  // Credit a finished focus session to a task (increments its pomodoro count).
  const creditTaskPomodoro = useCallback(
    (id) => {
      if (!id) return
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completedPomos: t.completedPomos + 1 } : t)))
    },
    [setTasks],
  )

  // Which forest (level) index is currently active, from the running tree total.
  const activeIndex = useCallback(
    () => Math.floor(buildForest(history).totalTrees / PLOT_CAPACITY),
    [history],
  )

  // ---- History actions ----
  const logSession = useCallback(
    (minutes, taskId) => {
      const i = activeIndex()
      const forestId = forests[i]?.id ?? null
      setHistory((prev) => [...prev, { ts: Date.now(), minutes, taskId: taskId ?? null, forestId }])
      setForests((prev) => {
        if (!prev[i]) return prev
        const next = prev.slice()
        next[i] = { ...next[i], focusMinutes: next[i].focusMinutes + minutes }
        return next
      })
    },
    [setHistory, setForests, forests, activeIndex],
  )

  const clearHistory = useCallback(() => setHistory([]), [setHistory])

  // ---- Forest / world actions ----
  // Pin the forest at `index` to a country (onboarding or a level-up).
  const chooseCountry = useCallback(
    (index, country) => {
      setForests((prev) => {
        const next = prev.slice()
        // Finalize the previous forest when advancing.
        if (index > 0 && next[index - 1] && !next[index - 1].completedAt) {
          next[index - 1] = { ...next[index - 1], completedAt: Date.now() }
        }
        next[index] = {
          id: makeId(),
          index,
          countryId: country.id,
          countryName: country.name,
          hueIndex: index % LEVEL_HUES.length,
          startedAt: Date.now(),
          completedAt: null,
          focusMinutes: 0,
          breaks: 0,
          tasksCompleted: 0,
        }
        return next
      })
    },
    [setForests],
  )

  const addBreak = useCallback(() => {
    setForests((prev) => {
      const i = activeIndex()
      if (!prev[i]) return prev
      const next = prev.slice()
      next[i] = { ...next[i], breaks: next[i].breaks + 1 }
      return next
    })
  }, [setForests, activeIndex])

  const addTaskDone = useCallback(() => {
    setForests((prev) => {
      const i = activeIndex()
      if (!prev[i]) return prev
      const next = prev.slice()
      next[i] = { ...next[i], tasksCompleted: next[i].tasksCompleted + 1 }
      return next
    })
  }, [setForests, activeIndex])

  const clearForests = useCallback(() => setForests([]), [setForests])

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
      tasks,
      addTask,
      updateTask,
      removeTask,
      moveTask,
      creditTaskPomodoro,
      history,
      logSession,
      clearHistory,
      forests,
      chooseCountry,
      addBreak,
      addTaskDone,
      clearForests,
    }),
    [
      settings,
      updateSettings,
      resetSettings,
      tasks,
      addTask,
      updateTask,
      removeTask,
      moveTask,
      creditTaskPomodoro,
      history,
      logSession,
      clearHistory,
      forests,
      chooseCountry,
      addBreak,
      addTaskDone,
      clearForests,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within an AppStoreProvider')
  return ctx
}
