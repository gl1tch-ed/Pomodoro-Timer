// Turn the raw focus-session history into a forest.
//
// Rule: every hour (60 min) of focus in a day plants a full tree, and the
// leftover time grows one partial sapling — so effort is always visible.
// A history record is { ts, minutes, taskId }; nothing new is persisted, the
// whole forest is derived from what the timer already logs.

import { startOfDay } from './time.js'
import { hashSeed } from './rng.js'

export const TREE_MINUTES = 60 // 1 hour == one tree

/** Sum focus minutes per day → Map<dayStart, minutes>. */
function minutesByDay(history) {
  const map = new Map()
  for (const r of history) {
    const day = startOfDay(r.ts)
    map.set(day, (map.get(day) || 0) + (r.minutes || 0))
  }
  return map
}

/**
 * Build the forest model from history.
 *
 * Returns the list of plants (oldest day first) plus the numbers the Forest
 * view shows: total trees, today's minutes, and progress toward today's next
 * tree.
 *
 * plant = { id, kind: 'tree' | 'sapling', day, stage, seed }
 *   - trees have stage 1; saplings have stage in (0, 1) sized by leftover time.
 */
export function buildForest(history, now = Date.now()) {
  const byDay = minutesByDay(history)
  const today = startOfDay(now)

  const plants = []
  let totalTrees = 0
  let saplingCount = 0

  // Oldest → newest so the forest "grows" left-to-right / back-to-front.
  const days = Array.from(byDay.keys()).sort((a, b) => a - b)

  for (const day of days) {
    const minutes = byDay.get(day)
    const fullTrees = Math.floor(minutes / TREE_MINUTES)
    const remainder = minutes % TREE_MINUTES

    for (let i = 0; i < fullTrees; i++) {
      plants.push({
        id: `${day}-t${i}`,
        kind: 'tree',
        day,
        stage: 1,
        seed: hashSeed(`${day}:${i}`),
      })
      totalTrees += 1
    }

    if (remainder > 0) {
      plants.push({
        id: `${day}-s`,
        kind: 'sapling',
        day,
        stage: remainder / TREE_MINUTES,
        seed: hashSeed(`${day}:sap`),
      })
      saplingCount += 1
    }
  }

  const todayMinutes = byDay.get(today) || 0
  const remainderMin = todayMinutes % TREE_MINUTES
  const todayStage = remainderMin / TREE_MINUTES // progress toward the next tree
  const minsToNextTree = Math.max(0, TREE_MINUTES - remainderMin)
  const treesToday = Math.floor(todayMinutes / TREE_MINUTES)

  return {
    plants,
    totalTrees,
    saplingCount,
    activeDays: days.length,
    todayMinutes,
    remainderMin,
    todayStage,
    minsToNextTree,
    treesToday,
  }
}
