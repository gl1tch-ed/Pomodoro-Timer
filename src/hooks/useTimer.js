import { useCallback, useEffect, useRef, useState } from 'react'
import { MIN } from '../utils/time.js'

export const PHASES = {
  focus: { key: 'focus', label: 'Focus' },
  short: { key: 'short', label: 'Short Break' },
  long: { key: 'long', label: 'Long Break' },
}

/** Duration (seconds) of a phase given the current settings. */
export function phaseSeconds(phase, settings) {
  const map = {
    focus: settings.focusMin,
    short: settings.shortMin,
    long: settings.longMin,
  }
  return Math.max(1, Math.round((map[phase] ?? 25) * MIN))
}

/**
 * The Pomodoro countdown engine.
 *
 * Owns: current phase, seconds remaining, running state, and how many focus
 * sessions have completed in the current cycle. Drift-corrects against
 * Date.now() so it stays accurate even when the tab is backgrounded.
 *
 * `onComplete(phase, { minutes, nextPhase })` fires when a phase reaches zero,
 * letting the caller log the session, notify, etc.
 */
export function useTimer(settings, onComplete) {
  const [phase, setPhase] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(() => phaseSeconds('focus', settings))
  const [isRunning, setRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0) // focus sessions done this cycle

  // Refs for the drift-corrected ticker.
  const endAtRef = useRef(0) // wall-clock ms when the current phase should hit 0
  const startedRef = useRef(false) // has this phase been started/consumed yet?
  const rafRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Decide which phase follows a completed one.
  const nextPhaseAfter = useCallback(
    (completed, nextCycleCount) => {
      if (completed === 'focus') {
        return nextCycleCount % settings.longEvery === 0 ? 'long' : 'short'
      }
      return 'focus'
    },
    [settings.longEvery],
  )

  // When idle and untouched, keep the display in sync with settings/phase.
  useEffect(() => {
    if (!isRunning && !startedRef.current) {
      setSecondsLeft(phaseSeconds(phase, settings))
    }
  }, [phase, settings, isRunning])

  const stopTicker = useCallback(() => {
    if (rafRef.current) {
      clearInterval(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Advance to the phase that follows the one that just finished.
  const completePhase = useCallback(() => {
    const finished = phase
    const finishedMinutes = phaseSeconds(finished, settings) / MIN

    let nextCycle = cycleCount
    if (finished === 'focus') {
      nextCycle = cycleCount + 1
      setCycleCount(nextCycle)
    }
    const next = nextPhaseAfter(finished, nextCycle)

    // Notify the app (logging, notification, task credit).
    onCompleteRef.current?.(finished, {
      minutes: finishedMinutes,
      nextPhase: next,
    })

    // Move to the next phase.
    startedRef.current = false
    setPhase(next)
    const nextSecs = phaseSeconds(next, settings)
    setSecondsLeft(nextSecs)

    // Decide whether to auto-start the next phase.
    const autoStart =
      next === 'focus' ? settings.autoStartFocus : settings.autoStartBreaks
    if (autoStart) {
      startedRef.current = true
      endAtRef.current = Date.now() + nextSecs * 1000
      setRunning(true)
    } else {
      setRunning(false)
    }
  }, [phase, cycleCount, settings, nextPhaseAfter])

  // The ticker: recompute remaining from the target end time (drift-proof).
  useEffect(() => {
    if (!isRunning) {
      stopTicker()
      return
    }
    const tick = () => {
      const remainingMs = endAtRef.current - Date.now()
      if (remainingMs <= 0) {
        setSecondsLeft(0)
        stopTicker()
        completePhase()
      } else {
        setSecondsLeft(Math.ceil(remainingMs / 1000))
      }
    }
    tick()
    rafRef.current = setInterval(tick, 250)
    return stopTicker
  }, [isRunning, completePhase, stopTicker])

  // ---- Controls ----
  const start = useCallback(() => {
    if (isRunning) return
    startedRef.current = true
    endAtRef.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }, [isRunning, secondsLeft])

  const pause = useCallback(() => {
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    startedRef.current = false
    setSecondsLeft(phaseSeconds(phase, settings))
  }, [phase, settings])

  const toggle = useCallback(() => {
    if (isRunning) pause()
    else start()
  }, [isRunning, pause, start])

  // Jump straight to a phase without logging a completion.
  const goToPhase = useCallback(
    (target) => {
      setRunning(false)
      startedRef.current = false
      setPhase(target)
      setSecondsLeft(phaseSeconds(target, settings))
    },
    [settings],
  )

  // Skip: advance as if the current phase finished, but do NOT log the session.
  const skip = useCallback(() => {
    setRunning(false)
    stopTicker()
    const finished = phase
    let nextCycle = cycleCount
    if (finished === 'focus') {
      nextCycle = cycleCount + 1
      setCycleCount(nextCycle)
    }
    const next = nextPhaseAfter(finished, nextCycle)
    startedRef.current = false
    setPhase(next)
    setSecondsLeft(phaseSeconds(next, settings))
  }, [phase, cycleCount, settings, nextPhaseAfter, stopTicker])

  const total = phaseSeconds(phase, settings)
  const progress = total > 0 ? 1 - secondsLeft / total : 0

  return {
    phase,
    secondsLeft,
    isRunning,
    cycleCount,
    longEvery: settings.longEvery,
    progress: Math.min(1, Math.max(0, progress)),
    start,
    pause,
    toggle,
    reset,
    skip,
    goToPhase,
  }
}
