import { describe, it, expect } from 'vitest'
import {
  PLOT_CAPACITY,
  LEVEL_HUES,
  hueIndexFor,
  hueFor,
  currentIndexFor,
  needsCountry,
  treesInForest,
  activeForest,
  usedCountryIds,
  totalTreesOf,
} from './world.js'
import { startOfDay } from './time.js'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.now()

function forest(index, extra = {}) {
  return {
    id: `f${index}`,
    index,
    countryId: `C${index}`,
    countryName: `Country ${index}`,
    hueIndex: index % LEVEL_HUES.length,
    completedAt: null,
    focusMinutes: 0,
    breaks: 0,
    tasksCompleted: 0,
    ...extra,
  }
}

describe('constants', () => {
  it('a plot completes at 24 trees', () => {
    expect(PLOT_CAPACITY).toBe(24)
  })
  it('has a 6-hue rotation', () => {
    expect(LEVEL_HUES).toHaveLength(6)
  })
})

describe('hueIndexFor / hueFor', () => {
  it('wraps around the hue list', () => {
    expect(hueIndexFor(0)).toBe(0)
    expect(hueIndexFor(6)).toBe(0)
    expect(hueIndexFor(7)).toBe(1)
  })
  it('handles negative indices', () => {
    expect(hueIndexFor(-1)).toBe(5)
  })
  it('maps to the matching hue string', () => {
    expect(hueFor(0)).toBe(LEVEL_HUES[0])
    expect(hueFor(6)).toBe(LEVEL_HUES[0])
    expect(hueFor(7)).toBe(LEVEL_HUES[1])
  })
})

describe('currentIndexFor', () => {
  it('groups trees into plots of PLOT_CAPACITY', () => {
    expect(currentIndexFor(0)).toBe(0)
    expect(currentIndexFor(23)).toBe(0)
    expect(currentIndexFor(24)).toBe(1)
    expect(currentIndexFor(48)).toBe(2)
  })
})

describe('needsCountry', () => {
  it('returns the onboarding index (0) when no forest exists', () => {
    expect(needsCountry([], 0)).toBe(0)
  })
  it('returns -1 when the active forest already has a country', () => {
    expect(needsCountry([forest(0)], 0)).toBe(-1)
  })
  it('returns the next index right after completing a plot', () => {
    expect(needsCountry([forest(0)], 24)).toBe(1)
  })
})

describe('treesInForest', () => {
  it('is 0 for a missing forest', () => {
    expect(treesInForest(null, 10)).toBe(0)
  })
  it('is full for a completed forest', () => {
    expect(treesInForest(forest(0, { completedAt: NOW }), 5)).toBe(PLOT_CAPACITY)
  })
  it('counts this forest’s share of the running total', () => {
    expect(treesInForest(forest(0), 10)).toBe(10)
    expect(treesInForest(forest(1), 30)).toBe(6)
  })
  it('clamps to [0, PLOT_CAPACITY]', () => {
    expect(treesInForest(forest(1), 100)).toBe(PLOT_CAPACITY)
    expect(treesInForest(forest(1), 10)).toBe(0)
  })
})

describe('activeForest', () => {
  const forests = [forest(0), forest(1)]
  it('picks the forest matching the current tree total', () => {
    expect(activeForest(forests, 0)).toBe(forests[0])
    expect(activeForest(forests, 30)).toBe(forests[1])
  })
  it('is null when the index has no forest', () => {
    expect(activeForest(forests, 100)).toBeNull()
  })
})

describe('usedCountryIds', () => {
  it('collects string country ids and skips holes', () => {
    const set = usedCountryIds([forest(0, { countryId: 'USA' }), null, forest(2, { countryId: 840 })])
    expect(set).toBeInstanceOf(Set)
    expect(set.has('USA')).toBe(true)
    expect(set.has('840')).toBe(true)
    expect(set.size).toBe(2)
  })
})

describe('totalTreesOf', () => {
  it('derives total trees from history via the per-hour rule', () => {
    const history = [{ ts: startOfDay(NOW) + 3600000, minutes: 120, taskId: null }]
    expect(totalTreesOf(history)).toBe(2)
  })
})
