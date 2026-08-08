import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * State that transparently persists to localStorage under `key`.
 * Works like useState, but survives reloads. Accepts a functional updater too.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw)
    } catch {
      /* corrupt or unavailable storage — fall back to the initial value */
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  // Keep a ref so the setter identity stays stable regardless of value changes.
  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value))
    } catch {
      /* storage full or blocked — ignore, app still works in-memory */
    }
  }, [value])

  const set = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next))
  }, [])

  return [value, set]
}
