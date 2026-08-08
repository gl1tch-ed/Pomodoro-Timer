import { describe, it, expect } from 'vitest'
import { MIN, formatClock, formatMinutes, startOfDay, dayDiff } from './time.js'

describe('MIN', () => {
  it('is 60 seconds', () => {
    expect(MIN).toBe(60)
  })
})

describe('formatClock', () => {
  it('formats whole minutes and seconds as M:SS', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(59)).toBe('0:59')
    expect(formatClock(60)).toBe('1:00')
    expect(formatClock(125)).toBe('2:05')
    expect(formatClock(1500)).toBe('25:00')
  })

  it('rounds fractional seconds', () => {
    expect(formatClock(59.6)).toBe('1:00')
    expect(formatClock(30.2)).toBe('0:30')
  })

  it('clamps negatives to zero', () => {
    expect(formatClock(-5)).toBe('0:00')
  })
})

describe('formatMinutes', () => {
  it('shows minutes under an hour', () => {
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(40)).toBe('40m')
    expect(formatMinutes(59)).toBe('59m')
  })

  it('shows whole hours without trailing minutes', () => {
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(120)).toBe('2h')
  })

  it('shows hours and minutes together', () => {
    expect(formatMinutes(95)).toBe('1h 35m')
    expect(formatMinutes(150)).toBe('2h 30m')
  })

  it('rounds and clamps negatives', () => {
    expect(formatMinutes(59.6)).toBe('1h')
    expect(formatMinutes(-10)).toBe('0m')
  })
})

describe('startOfDay', () => {
  it('returns local midnight of the given timestamp', () => {
    const ts = new Date(2026, 7, 8, 13, 45, 30, 500).getTime()
    const expected = new Date(2026, 7, 8, 0, 0, 0, 0).getTime()
    expect(startOfDay(ts)).toBe(expected)
  })

  it('is idempotent', () => {
    const ts = new Date(2026, 0, 1, 9, 0, 0).getTime()
    expect(startOfDay(startOfDay(ts))).toBe(startOfDay(ts))
  })
})

describe('dayDiff', () => {
  const DAY = 24 * 60 * 60 * 1000
  const base = new Date(2026, 7, 8, 12, 0, 0).getTime()

  it('is 0 for two times on the same day', () => {
    const morning = new Date(2026, 7, 8, 1, 0, 0).getTime()
    const night = new Date(2026, 7, 8, 23, 0, 0).getTime()
    expect(dayDiff(morning, night)).toBe(0)
  })

  it('counts whole days forward and backward', () => {
    expect(dayDiff(base, base + 3 * DAY)).toBe(3)
    expect(dayDiff(base, base - 2 * DAY)).toBe(-2)
  })
})
