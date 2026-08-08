// The Forest view: your rotatable world globe next to the current forest plot,
// today's-growth + plot progress, and the browsable forest history. When a place
// still needs choosing (onboarding or a level-up), the globe enters select mode.

import { useMemo } from 'react'
import { useAppStore } from '../context/AppStore.jsx'
import { buildForest, TREE_MINUTES } from '../utils/forest.js'
import { computeStreak } from '../utils/stats.js'
import { formatMinutes, startOfDay } from '../utils/time.js'
import { PLOT_CAPACITY, LEVEL_HUES, needsCountry, hueFor } from '../utils/world.js'
import ForestScene from './ForestScene.jsx'
import Globe from './Globe.jsx'
import ForestHistory from './ForestHistory.jsx'

export default function ForestView({ onPicked }) {
  const { history, forests, chooseCountry } = useAppStore()
  const forest = useMemo(() => buildForest(history), [history])
  const streak = useMemo(() => computeStreak(history), [history])
  const todayKey = startOfDay(Date.now())

  const totalTrees = forest.totalTrees
  const currentIndex = Math.floor(totalTrees / PLOT_CAPACITY)
  const active = forests[currentIndex] || null
  const pickIndex = needsCountry(forests, totalTrees) // -1 or the index awaiting a country
  const isPicking = pickIndex >= 0
  const hueIndex = active ? active.hueIndex : currentIndex % LEVEL_HUES.length

  // Current plot = this level's trees + today's in-progress sapling.
  const { plotPlants, treesThisLevel } = useMemo(() => {
    const treeArr = forest.plants.filter((p) => p.kind === 'tree')
    const current = treeArr.slice(currentIndex * PLOT_CAPACITY)
    const sap = forest.plants.find((p) => p.kind === 'sapling' && p.day === todayKey)
    return { plotPlants: sap ? [...current, sap] : current, treesThisLevel: current.length }
  }, [forest.plants, currentIndex, todayKey])

  const todayPct = Math.round(forest.todayStage * 100)
  const plotPct = Math.round((treesThisLevel / PLOT_CAPACITY) * 100)
  const levelColor = hueFor(hueIndex)

  return (
    <section className="forest">
      <header className="forest-head">
        <div>
          <h2 className="forest-title">Your Forest</h2>
          <p className="forest-sub">
            {totalTrees === 0
              ? 'Pick a place on the globe and grow your first forest.'
              : `${totalTrees} ${totalTrees === 1 ? 'tree' : 'trees'} grown${active ? ` in ${active.countryName}` : ''}.`}
          </p>
        </div>
        <div className="forest-badges">
          <span className="fbadge fbadge-level">
            <span className="lvl-swatch" style={{ background: levelColor }} aria-hidden="true" />
            Level <span className="fbadge-n">{currentIndex + 1}</span>
          </span>
          <span className="fbadge"><span className="fbadge-n">{totalTrees}</span> 🌳</span>
          {streak > 0 && (
            <span className="fbadge fbadge-streak">
              <span className="fbadge-n">{streak}</span> day{streak === 1 ? '' : 's'} 🔥
            </span>
          )}
        </div>
      </header>

      {isPicking && (
        <div className="pick-banner">
          <span className="pb-emoji" aria-hidden="true">🌍</span>
          <span className="pb-text">
            Pick where to grow your {pickIndex === 0 ? 'first' : 'next'} forest
            <span className="pb-sub">Spin the globe and tap a country to plant it there.</span>
          </span>
        </div>
      )}

      <div className="world-row">
        <div>
          <Globe
            forests={forests}
            totalTrees={totalTrees}
            selectable={isPicking}
            onPick={(country) => {
              chooseCountry(pickIndex, country)
              onPicked?.()
            }}
            size={300}
          />
          <p className="globe-hint">{isPicking ? 'Tap a country to plant here' : 'Drag to spin the world'}</p>
        </div>

        {isPicking ? (
          <div className="plot-placeholder">
            <span className="pp-title">Awaiting a place 🌱</span>
            <span>Choose a spot on the globe to start this forest.</span>
          </div>
        ) : (
          <div className="scene-frame">
            <ForestScene plants={plotPlants} colorIndex={hueIndex} />
          </div>
        )}
      </div>

      {/* today's growth toward the next tree */}
      <div className="grow-meter">
        <div className="grow-row">
          <span className="grow-label">Today’s growth</span>
          <span className="grow-value">
            {formatMinutes(forest.todayMinutes % TREE_MINUTES)} / {formatMinutes(TREE_MINUTES)}
            {forest.treesToday > 0 && <span className="grow-bonus"> · +{forest.treesToday} 🌳 today</span>}
          </span>
        </div>
        <div className="grow-track" role="progressbar" aria-valuenow={todayPct} aria-valuemin="0" aria-valuemax="100">
          <div className="grow-fill" style={{ width: `${todayPct}%` }} />
        </div>
        <p className="grow-hint">
          {forest.minsToNextTree === TREE_MINUTES && forest.todayMinutes === 0
            ? `Focus for ${formatMinutes(TREE_MINUTES)} today to grow a tree.`
            : `${formatMinutes(forest.minsToNextTree)} of focus to your next tree.`}
        </p>
      </div>

      {/* this forest's progress toward completion */}
      {active && (
        <div className="grow-meter">
          <div className="grow-row">
            <span className="grow-label">This forest · {active.countryName}</span>
            <span className="grow-value">{treesThisLevel} / {PLOT_CAPACITY} 🌳</span>
          </div>
          <div className="grow-track" role="progressbar" aria-valuenow={plotPct} aria-valuemin="0" aria-valuemax="100">
            <div className="grow-fill" style={{ width: `${plotPct}%`, background: levelColor }} />
          </div>
          <p className="grow-hint">
            {PLOT_CAPACITY - treesThisLevel} more {PLOT_CAPACITY - treesThisLevel === 1 ? 'tree' : 'trees'} to
            complete this forest and choose a new place.
          </p>
        </div>
      )}

      <ForestHistory forests={forests} totalTrees={totalTrees} />

      <p className="forest-foot">
        Every <b>hour</b> of focus grows a tree. Fill a plot with <b>{PLOT_CAPACITY} trees</b> to complete a
        forest — the country colours in on your globe, and you pick the next place. 🌲
      </p>
    </section>
  )
}
