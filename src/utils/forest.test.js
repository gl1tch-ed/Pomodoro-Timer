import { describe, it, expect } from 'vitest'
import { buildForest, TREE_MINUTES } from './forest.js'
import { startOfDay } from './time.js'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 7, 8, 12, 0, 0).getTime()
const TODAY = startOfDay(NOW)

function rec(offsetDays, minutes) {
  return { ts: TODAY - offsetDays * DAY + 9 * 60 * 60 * 1000, minutes, taskId: null }
}

describe('TREE_MINUTES', () => {
  it('is one hour per tree', () => {
    expect(TREE_MINUTES).toBe(60)
  })
})

describe('buildForest', () => {
  it('returns an empty forest for empty history', () => {
    const f = buildForest([], NOW)
    expect(f.plants).toEqual([])
    expect(f.totalTrees).toBe(0)
    expect(f.saplingCount).toBe(0)
    expect(f.activeDays).toBe(0)
    expect(f.todayMinutes).toBe(0)
    expect(f.treesToday).toBe(0)
    expect(f.todayStage).toBe(0)
    expect(f.minsToNextTree).toBe(60)
  })

  it('plants one full tree per 60 minutes', () => {
    const f = buildForest([rec(1, 60)], NOW)
    expect(f.totalTrees).toBe(1)
    expect(f.saplingCount).toBe(0)
    expect(f.plants).toHaveLength(1)
    expect(f.plants[0]).toMatchObject({ kind: 'tree', stage: 1 })
  })

  it('grows a leftover sapling for the remaining minutes', () => {
    const f = buildForest([rec(1, 90)], NOW)
    expect(f.totalTrees).toBe(1)
    expect(f.saplingCount).toBe(1)
    expect(f.plants).toHaveLength(2)
    const sapling = f.plants.find((p) => p.kind === 'sapling')
    expect(sapling.stage).toBeCloseTo(0.5)
  })

  it('summarizes today separately', () => {
    const f = buildForest([rec(0, 90)], NOW)
    expect(f.todayMinutes).toBe(90)
    expect(f.remainderMin).toBe(30)
    expect(f.todayStage).toBeCloseTo(0.5)
    expect(f.minsToNextTree).toBe(30)
    expect(f.treesToday).toBe(1)
  })

  it('orders plants oldest day first', () => {
    const older = rec(3, 60)
    const newer = rec(1, 60)
    const f = buildForest([newer, older], NOW) // deliberately out of order
    expect(f.plants[0].day).toBeLessThan(f.plants[1].day)
    expect(f.activeDays).toBe(2)
  })

  it('uses stable ids and seeds (deterministic across runs)', () => {
    const history = [rec(2, 150)] // 2 trees + 1 sapling
    const a = buildForest(history, NOW)
    const b = buildForest(history, NOW)
    expect(a.plants.map((p) => p.id)).toEqual(b.plants.map((p) => p.id))
    expect(a.plants.map((p) => p.seed)).toEqual(b.plants.map((p) => p.seed))
    const day = a.plants[0].day
    expect(a.plants[0].id).toBe(`${day}-t0`)
    expect(a.plants[2].id).toBe(`${day}-s`)
  })
})
