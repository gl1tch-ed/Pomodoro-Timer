import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer, phaseSeconds } from './useTimer.js'

const BASE = {
  focusMin: 1,
  shortMin: 1,
  longMin: 1,
  longEvery: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  notifications: false,
}

describe('phaseSeconds (pure)', () => {
  it('converts each phase’s minutes to seconds', () => {
    const s = { focusMin: 25, shortMin: 5, longMin: 15 }
    expect(phaseSeconds('focus', s)).toBe(1500)
    expect(phaseSeconds('short', s)).toBe(300)
    expect(phaseSeconds('long', s)).toBe(900)
  })

  it('defaults an unknown phase / missing value to 25 minutes', () => {
    expect(phaseSeconds('focus', {})).toBe(1500)
    expect(phaseSeconds('nope', { focusMin: 10 })).toBe(1500)
  })

  it('never returns less than 1 second and rounds', () => {
    expect(phaseSeconds('focus', { focusMin: 0 })).toBe(1)
    expect(phaseSeconds('focus', { focusMin: 0.5 })).toBe(30)
  })
})

describe('useTimer engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes to the focus phase at full duration, not running', () => {
    const { result } = renderHook(() => useTimer(BASE, vi.fn()))
    expect(result.current.phase).toBe('focus')
    expect(result.current.secondsLeft).toBe(60)
    expect(result.current.isRunning).toBe(false)
  })

  it('counts down while running (drift-corrected)', () => {
    const { result } = renderHook(() => useTimer(BASE, vi.fn()))
    act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.secondsLeft).toBe(50)
    expect(result.current.progress).toBeCloseTo(10 / 60)
  })

  it('pause halts the countdown', () => {
    const { result } = renderHook(() => useTimer(BASE, vi.fn()))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10_000))
    act(() => result.current.pause())
    const frozen = result.current.secondsLeft
    act(() => vi.advanceTimersByTime(5_000))
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(frozen)
  })

  it('reset restores the full duration and stops', () => {
    const { result } = renderHook(() => useTimer(BASE, vi.fn()))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(20_000))
    act(() => result.current.reset())
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(60)
  })

  it('fires onComplete when a focus phase finishes and advances to a short break', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTimer(BASE, onComplete))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(60_000))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith('focus', { minutes: 1, nextPhase: 'short' })
    expect(result.current.phase).toBe('short')
    expect(result.current.cycleCount).toBe(1)
    expect(result.current.isRunning).toBe(false)
  })

  it('routes to a long break every `longEvery` focus sessions', () => {
    const onComplete = vi.fn()
    const settings = { ...BASE, longEvery: 1 } // every focus → long break
    const { result } = renderHook(() => useTimer(settings, onComplete))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(60_000))
    expect(onComplete).toHaveBeenCalledWith('focus', { minutes: 1, nextPhase: 'long' })
    expect(result.current.phase).toBe('long')
  })

  it('auto-starts the break when autoStartBreaks is on', () => {
    const settings = { ...BASE, autoStartBreaks: true }
    const { result } = renderHook(() => useTimer(settings, vi.fn()))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(60_000))
    expect(result.current.phase).toBe('short')
    expect(result.current.isRunning).toBe(true)
  })

  it('skip advances the phase WITHOUT logging a completion', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTimer(BASE, onComplete))
    act(() => result.current.skip())
    expect(onComplete).not.toHaveBeenCalled()
    expect(result.current.phase).toBe('short')
    expect(result.current.cycleCount).toBe(1)
    expect(result.current.isRunning).toBe(false)
  })

  it('goToPhase jumps straight to a phase at full duration', () => {
    const { result } = renderHook(() => useTimer({ ...BASE, longMin: 15 }, vi.fn()))
    act(() => result.current.goToPhase('long'))
    expect(result.current.phase).toBe('long')
    expect(result.current.secondsLeft).toBe(900)
    expect(result.current.isRunning).toBe(false)
  })
})
