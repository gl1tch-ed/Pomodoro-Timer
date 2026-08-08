// Small time helpers shared across the app.

export const MIN = 60 // seconds in a minute

/** Format a number of seconds as "M:SS" or "MM:SS". */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Format minutes as a friendly duration, e.g. 95 -> "1h 35m", 40 -> "40m". */
export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

/** Midnight timestamp for the day containing `ts`. */
export function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Whole days between two timestamps (b - a), ignoring time of day. */
export function dayDiff(aTs, bTs) {
  const DAY = 24 * 60 * 60 * 1000
  return Math.round((startOfDay(bTs) - startOfDay(aTs)) / DAY)
}
