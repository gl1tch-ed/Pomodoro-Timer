// Aggregate the raw session history into the numbers the Statistics panel shows.
// A history record looks like: { ts: <ms>, minutes: <number>, taskId: <id|null> }

import { startOfDay, dayDiff } from './time.js'

/** Sum of focus minutes across all records. */
function totalMinutes(history) {
  return history.reduce((sum, r) => sum + (r.minutes || 0), 0)
}

/**
 * Compute the current daily streak: consecutive days (ending today or
 * yesterday) that have at least one completed focus session.
 */
export function computeStreak(history, now = Date.now()) {
  if (!history.length) return 0
  const days = new Set(history.map((r) => startOfDay(r.ts)))
  const today = startOfDay(now)

  // A streak is still "alive" if the most recent session was today or yesterday.
  let cursor
  if (days.has(today)) cursor = today
  else if (days.has(today - 86400000)) cursor = today - 86400000
  else return 0

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor -= 86400000
  }
  return streak
}

/**
 * Build the full stats summary used by the UI.
 * Returns counts for today/this week, totals, streak, and a last-7-days series.
 */
export function summarize(history, now = Date.now()) {
  const today = startOfDay(now)
  const weekAgo = today - 6 * 86400000 // inclusive 7-day window (today + prev 6)

  let todaySessions = 0
  let todayMinutes = 0
  let weekSessions = 0
  let weekMinutes = 0

  for (const r of history) {
    const day = startOfDay(r.ts)
    if (day === today) {
      todaySessions += 1
      todayMinutes += r.minutes || 0
    }
    if (day >= weekAgo) {
      weekSessions += 1
      weekMinutes += r.minutes || 0
    }
  }

  // Last-7-days series (oldest -> newest) of focus minutes per day.
  const series = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = today - i * 86400000
    const minutes = history
      .filter((r) => startOfDay(r.ts) === dayStart)
      .reduce((s, r) => s + (r.minutes || 0), 0)
    const label = new Date(dayStart).toLocaleDateString(undefined, { weekday: 'short' })
    series.push({ dayStart, minutes, label, isToday: dayDiff(dayStart, now) === 0 })
  }

  return {
    totalSessions: history.length,
    totalMinutes: totalMinutes(history),
    todaySessions,
    todayMinutes,
    weekSessions,
    weekMinutes,
    streak: computeStreak(history, now),
    series,
  }
}
