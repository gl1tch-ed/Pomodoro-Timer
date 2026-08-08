import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from './context/AppStore.jsx'
import { useAuth } from './context/AuthProvider.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useTimer, PHASES } from './hooks/useTimer.js'
import { playChime } from './audio/chime.js'
import { formatClock } from './utils/time.js'

import ModeTabs from './components/ModeTabs.jsx'
import TimerCard from './components/TimerCard.jsx'
import TimerControls from './components/TimerControls.jsx'
import ActiveTask from './components/ActiveTask.jsx'
import TaskList from './components/TaskList.jsx'
import Statistics from './components/Statistics.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import ForestView from './components/ForestView.jsx'

const PHASE_MESSAGES = {
  focus: 'Time to focus — you’ve got this. 🌿',
  short: 'Short break — breathe and stretch. 🍵',
  long: 'Long break — rest well, you earned it. 🌸',
}

export default function App() {
  const { settings, tasks, logSession, creditTaskPomodoro, addBreak, forests } = useAppStore()
  const { user, signOut } = useAuth()
  const [activeTaskId, setActiveTaskId] = useLocalStorage('pomodoro.activeTask', null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [view, setView] = useState('timer') // 'timer' | 'forest'
  const [theme, setTheme] = useLocalStorage(
    'pomodoro.theme',
    () => (typeof document !== 'undefined' && document.documentElement.dataset.theme) || 'light',
  )
  // Reflect the chosen theme on the document root.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Keep a live ref to the active task id so the timer callback always sees the latest.
  const activeTaskRef = useRef(activeTaskId)
  activeTaskRef.current = activeTaskId

  const notify = useCallback((title, body) => {
    if (!settings.notifications) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    try {
      new Notification(title, { body, silent: true })
    } catch {
      /* ignore */
    }
  }, [settings.notifications])

  // Fired by the timer engine whenever a phase completes.
  const onComplete = useCallback(
    (finishedPhase, { minutes, nextPhase }) => {
      playChime()
      if (finishedPhase === 'focus') {
        logSession(minutes, activeTaskRef.current)
        creditTaskPomodoro(activeTaskRef.current)
      } else {
        // a completed short/long break counts toward the active forest
        addBreak()
      }
      notify(
        `${PHASES[finishedPhase].label} complete`,
        PHASE_MESSAGES[nextPhase] || 'On to the next one.',
      )
    },
    [logSession, creditTaskPomodoro, addBreak, notify],
  )

  const timer = useTimer(settings, onComplete)

  // First time they start a timer with no forest yet: send them to the globe to
  // choose where to grow their first forest, then bring them back to the timer.
  const promptedRef = useRef(false)
  const pendingReturnRef = useRef(false)
  useEffect(() => {
    if (timer.isRunning && forests.length === 0 && !promptedRef.current) {
      promptedRef.current = true
      pendingReturnRef.current = true
      setView('forest')
    }
  }, [timer.isRunning, forests.length])

  // After that onboarding pick, return to the timer so the running countdown shows.
  const handleCountryPicked = useCallback(() => {
    if (pendingReturnRef.current) {
      pendingReturnRef.current = false
      setView('timer')
    }
  }, [])

  // Reflect the countdown in the browser tab title.
  useEffect(() => {
    const base = 'Bloom'
    if (timer.isRunning || timer.progress > 0) {
      document.title = `${formatClock(timer.secondsLeft)} · ${PHASES[timer.phase].label} — ${base}`
    } else {
      document.title = `${base} — A Relaxing Pomodoro Timer`
    }
  }, [timer.secondsLeft, timer.isRunning, timer.phase, timer.progress])

  // Spacebar toggles start/pause (unless typing in a field).
  useEffect(() => {
    function onKey(e) {
      if (e.code !== 'Space') return
      const el = document.activeElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return
      e.preventDefault()
      timer.toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [timer])

  const activeTask = tasks.find((t) => t.id === activeTaskId && !t.done) || null

  return (
    <div className={`app phase-${timer.phase}`}>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🌱
          </span>
          <div>
            <div className="brand-name">Bloom</div>
            <div className="brand-sub">a calm place to focus</div>
          </div>
        </div>
        <div className="header-actions">
          <div className="view-switch" role="tablist" aria-label="View">
            <button
              role="tab"
              aria-selected={view === 'timer'}
              className={`view-tab ${view === 'timer' ? 'is-active' : ''}`}
              onClick={() => setView('timer')}
            >
              Timer
            </button>
            <button
              role="tab"
              aria-selected={view === 'forest'}
              className={`view-tab ${view === 'forest' ? 'is-active' : ''}`}
              onClick={() => setView('forest')}
            >
              Forest
            </button>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="Settings"
          >
            <GearIcon />
          </button>
          {user && (
            <button
              className="btn btn-icon btn-ghost"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <SignOutIcon />
            </button>
          )}
        </div>
      </header>

      {view === 'timer' ? (
        <main className="main-grid">
          <div className="col">
            <section className="card timer-card">
              <ModeTabs phase={timer.phase} onSelect={timer.goToPhase} />
              <TimerCard
                phase={timer.phase}
                secondsLeft={timer.secondsLeft}
                progress={timer.progress}
                isRunning={timer.isRunning}
                cycleCount={timer.cycleCount}
                longEvery={timer.longEvery}
              />
              <TimerControls
                isRunning={timer.isRunning}
                onToggle={timer.toggle}
                onReset={timer.reset}
                onSkip={timer.skip}
              />
              <ActiveTask task={activeTask} />
            </section>
          </div>

          <div className="col">
            <TaskList activeTaskId={activeTaskId} onActivate={setActiveTaskId} />
            <Statistics />
          </div>
        </main>
      ) : (
        <main>
          <ForestView onPicked={handleCountryPicked} />
        </main>
      )}

      <footer className="app-footer muted">
        Press <kbd>Space</kbd> to start or pause · Made for calm, focused work.
      </footer>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}
