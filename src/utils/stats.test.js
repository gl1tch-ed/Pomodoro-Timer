import { describe, it, expect } from 'vitest'
import { computeStreak, summarize } from './stats.js'
import { startOfDay } from './time.js'

const DAY = 24 * 60 * 60 * 1000
// Fixed "now" so tests never depend on the real date.
const NOW = new Date(2026, 7, 8, 12, 0, 0).getTime()
const TODAY = startOfDay(NOW)

// A record whose ts lands `offset` whole days before today (0 = today).
function rec(offsetDays, minutes = 25, extra = {}) {
  return { ts: TODAY - offsetDays * DAY + 9 * 60 * 60 * 1000, minutes, taskId: null, ...extra }
}

describe('computeStreak', () => {
  it('is 0 for empty history', () => {
    expect(computeStreak([], NOW)).toBe(0)
  })

  it('counts a single session today as 1', () => {
    expect(computeStreak([rec(0)], NOW)).toBe(1)
  })

  it('counts consecutive today + yesterday as 2', () => {
    expect(computeStreak([rec(0), rec(1)], NOW)).toBe(2)
  })

  it('stays alive when the latest session was yesterday (not today)', () => {
    expect(computeStreak([rec(1), rec(2)], NOW)).toBe(2)
  })

  it('is dead when the latest session was two days ago', () => {
    expect(computeStreak([rec(2)], NOW)).toBe(0)
  })

  it('breaks on a gap day', () => {
    // today present, yesterday missing, day-before present → only today counts
    expect(computeStreak([rec(0), rec(2)], NOW)).toBe(1)
  })

  it('collapses multiple sessions on the same day into one streak day', () => {
    expect(computeStreak([rec(0), rec(0), rec(1)], NOW)).toBe(2)
  })
})

describe('summarize', () => {
  const history = [
    rec(0, 25), // today
    rec(0, 25), // today
    rec(1, 50), // yesterday (within week)
    rec(8, 30), // outside the 7-day window
  ]
  const s = summarize(history, NOW)

  it('counts today sessions and minutes', () => {
    expect(s.todaySessions).toBe(2)
    expect(s.todayMinutes).toBe(50)
  })

  it('counts this-week sessions and minutes (last 7 days inclusive)', () => {
    expect(s.weekSessions).toBe(3)
    expect(s.weekMinutes).toBe(100)
  })

  it('reports all-time totals', () => {
    expect(s.totalSessions).toBe(4)
    expect(s.totalMinutes).toBe(130)
  })

  it('derives the streak', () => {
    expect(s.streak).toBe(2)
  })

  it('builds a 7-day series, oldest → newest, with today flagged', () => {
    expect(s.series).toHaveLength(7)
    expect(s.series[6].isToday).toBe(true)
    expect(s.series[0].isToday).toBe(false)
    expect(s.series[6].minutes).toBe(50) // today
    expect(s.series[5].minutes).toBe(50) // yesterday
    expect(s.series[4].minutes).toBe(0) // two days ago, empty
  })

  it('guards against records missing a minutes field', () => {
    const withBad = summarize([{ ts: NOW, taskId: null }], NOW)
    expect(withBad.todaySessions).toBe(1)
    expect(withBad.todayMinutes).toBe(0)
    expect(withBad.totalMinutes).toBe(0)
  })

  it('handles empty history', () => {
    const empty = summarize([], NOW)
    expect(empty.totalSessions).toBe(0)
    expect(empty.streak).toBe(0)
    expect(empty.series).toHaveLength(7)
  })
})
