import { useMemo } from 'react'
import { useAppStore } from '../context/AppStore.jsx'
import { summarize } from '../utils/stats.js'
import { formatMinutes } from '../utils/time.js'

/** The statistics panel: headline numbers + a last-7-days focus bar chart. */
export default function Statistics() {
  const { history, tasks, clearHistory } = useAppStore()
  const stats = useMemo(() => summarize(history), [history])
  const tasksDone = tasks.filter((t) => t.done).length

  const maxMinutes = Math.max(1, ...stats.series.map((d) => d.minutes))

  return (
    <section className="card">
      <div className="card-title spread" style={{ display: 'flex' }}>
        <span>Statistics</span>
        {history.length > 0 && (
          <button
            className="btn btn-ghost stat-clear"
            onClick={() => {
              if (window.confirm('Clear all session history? This cannot be undone.')) {
                clearHistory()
              }
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="stat-grid">
        <Stat value={stats.todaySessions} label="Today" sub={formatMinutes(stats.todayMinutes)} />
        <Stat value={stats.weekSessions} label="This week" sub={formatMinutes(stats.weekMinutes)} />
        <Stat value={stats.streak} label="Day streak" sub={stats.streak === 1 ? 'day' : 'days'} accent />
        <Stat value={tasksDone} label="Tasks done" sub={`${tasks.length} total`} />
      </div>

      <div className="chart">
        <div className="chart-head">
          <span className="muted">Focus minutes · last 7 days</span>
          <span className="muted">{formatMinutes(stats.totalMinutes)} all-time</span>
        </div>
        <div className="chart-bars">
          {stats.series.map((d) => (
            <div className="chart-col" key={d.dayStart}>
              <div className="chart-bar-track">
                <div
                  className={`chart-bar ${d.isToday ? 'is-today' : ''}`}
                  style={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
                  title={`${d.label}: ${formatMinutes(d.minutes)}`}
                />
              </div>
              <span className={`chart-label ${d.isToday ? 'is-today' : ''}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label, sub, accent }) {
  return (
    <div className={`stat ${accent ? 'stat--accent' : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}
