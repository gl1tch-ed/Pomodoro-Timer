import { PHASES } from '../hooks/useTimer.js'
import { formatClock } from '../utils/time.js'

const SIZE = 260
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

/**
 * The circular timer: an SVG progress ring wrapping the countdown and a
 * small cycle indicator (how many focus sessions until a long break).
 */
export default function TimerCard({ phase, secondsLeft, progress, isRunning, cycleCount, longEvery }) {
  const offset = CIRC * (1 - progress)
  const label = PHASES[phase].label

  // Dots showing position within the current long-break cycle.
  const doneInCycle = cycleCount % longEvery

  return (
    <div className={`timer-ring-wrap phase-${phase} ${isRunning ? 'is-running' : ''}`}>
      <svg
        className="timer-ring"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${label}: ${formatClock(secondsLeft)} remaining`}
      >
        <circle
          className="ring-track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          className="ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>

      <div className="timer-center">
        <span className="timer-phase">{label}</span>
        <span className="timer-time">{formatClock(secondsLeft)}</span>
        <div className="cycle-dots" aria-hidden="true">
          {Array.from({ length: longEvery }).map((_, i) => (
            <span key={i} className={`cycle-dot ${i < doneInCycle ? 'is-filled' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
