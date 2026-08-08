// A browsable record of every forest — country, colour, and its stats
// (focus hours, trees, breaks, tasks) capped with a consistency quote.

import { treesInForest, hueFor, PLOT_CAPACITY } from '../utils/world.js'
import { formatMinutes } from '../utils/time.js'
import { quoteFor } from '../data/quotes.js'

export default function ForestHistory({ forests, totalTrees }) {
  const list = forests.filter(Boolean)
  if (!list.length) return null

  return (
    <section className="card forest-history">
      <div className="card-title">
        <span>Your forests</span>
        <span className="muted">· {list.length} {list.length === 1 ? 'place' : 'places'}</span>
      </div>

      <div className="fh-list">
        {list
          .slice()
          .reverse()
          .map((f) => {
            const trees = treesInForest(f, totalTrees)
            const done = !!f.completedAt
            const hue = hueFor(f.index)
            return (
              <article className="fh-card" key={f.id}>
                <header className="fh-head">
                  <span className="fh-dot" style={{ background: hue }} aria-hidden="true" />
                  <span className="fh-country">{f.countryName}</span>
                  <span className="fh-level">Lvl {f.index + 1}</span>
                  <span className={`fh-status ${done ? 'is-done' : ''}`}>
                    {done ? 'Complete' : `${trees}/${PLOT_CAPACITY}`}
                  </span>
                </header>

                <div className="fh-stats">
                  <div className="fh-stat"><b>{formatMinutes(f.focusMinutes)}</b><span>focus</span></div>
                  <div className="fh-stat"><b>{trees}</b><span>trees</span></div>
                  <div className="fh-stat"><b>{f.breaks}</b><span>breaks</span></div>
                  <div className="fh-stat"><b>{f.tasksCompleted}</b><span>tasks</span></div>
                </div>

                <p className="fh-quote">“{quoteFor(f.id)}”</p>
              </article>
            )
          })}
      </div>
    </section>
  )
}
