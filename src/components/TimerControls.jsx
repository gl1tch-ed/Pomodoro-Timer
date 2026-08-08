/** Start/Pause, Reset, and Skip controls beneath the timer. */
export default function TimerControls({ isRunning, onToggle, onReset, onSkip }) {
  return (
    <div className="timer-controls">
      <button
        className="btn btn-icon btn-ghost"
        onClick={onReset}
        aria-label="Reset timer"
        title="Reset"
      >
        <ResetIcon />
      </button>

      <button className="btn btn-primary btn-lg start-btn" onClick={onToggle}>
        {isRunning ? <PauseIcon /> : <PlayIcon />}
        {isRunning ? 'Pause' : 'Start'}
      </button>

      <button
        className="btn btn-icon btn-ghost"
        onClick={onSkip}
        aria-label="Skip to next phase"
        title="Skip"
      >
        <SkipIcon />
      </button>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5l9 7-9 7zM16 5h2v14h-2z" />
    </svg>
  )
}
