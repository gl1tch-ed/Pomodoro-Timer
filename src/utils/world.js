// Forest/world helpers: levels, per-forest hue, and derivation of a forest's
// trees/stats from the running tree total. A "forest" is one PLOT_CAPACITY-tree plot
// pinned to a country; completing it advances to the next level (next country,
// next hue).

import { buildForest } from './forest.js'

export const PLOT_CAPACITY = 24 // trees that complete a forest / level (1 tree == 1 hour)

// Earthy hue rotation — must match the .lvl-* classes in forest.css.
export const LEVEL_HUES = ['#b2966a', '#7f9a6a', '#6f8aa1', '#b07f6a', '#8a6f9a', '#5f9a92']

export function hueIndexFor(index) {
  return ((index % LEVEL_HUES.length) + LEVEL_HUES.length) % LEVEL_HUES.length
}
export function hueFor(index) {
  return LEVEL_HUES[hueIndexFor(index)]
}

/** Which forest (level) index the given tree total falls in. */
export function currentIndexFor(totalTrees) {
  return Math.floor(totalTrees / PLOT_CAPACITY)
}

/** Total trees for a history array (via the existing per-hour rule). */
export function totalTreesOf(history) {
  return buildForest(history).totalTrees
}

/**
 * The forest index that still needs a country chosen, or -1 if none:
 * onboarding (index 0) or right after completing a plot (next index).
 */
export function needsCountry(forests, totalTrees) {
  const idx = currentIndexFor(totalTrees)
  return forests[idx] ? -1 : idx
}

/** Trees belonging to a forest, given the running total. */
export function treesInForest(forest, totalTrees) {
  if (!forest) return 0
  if (forest.completedAt) return PLOT_CAPACITY
  return Math.max(0, Math.min(PLOT_CAPACITY, totalTrees - forest.index * PLOT_CAPACITY))
}

export function activeForest(forests, totalTrees) {
  return forests[currentIndexFor(totalTrees)] || null
}

export function usedCountryIds(forests) {
  return new Set(forests.filter(Boolean).map((f) => String(f.countryId)))
}
