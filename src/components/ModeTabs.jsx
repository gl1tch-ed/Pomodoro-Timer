import { PHASES } from '../hooks/useTimer.js'

const ORDER = ['focus', 'short', 'long']

/** The Focus / Short Break / Long Break switch above the timer. */
export default function ModeTabs({ phase, onSelect }) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="Timer mode">
      {ORDER.map((key) => (
        <button
          key={key}
          role="tab"
          aria-selected={phase === key}
          className={`mode-tab ${phase === key ? 'is-active' : ''} phase-${key}`}
          onClick={() => onSelect(key)}
        >
          {PHASES[key].label}
        </button>
      ))}
    </div>
  )
}
