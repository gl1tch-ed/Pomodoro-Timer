import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage.js'

describe('useLocalStorage', () => {
  it('reads an existing value from storage', () => {
    localStorage.setItem('k', JSON.stringify(42))
    const { result } = renderHook(() => useLocalStorage('k', 0))
    expect(result.current[0]).toBe(42)
  })

  it('falls back to the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('missing', 'hello'))
    expect(result.current[0]).toBe('hello')
  })

  it('supports a lazy (function) initial value', () => {
    const { result } = renderHook(() => useLocalStorage('lazy', () => 'computed'))
    expect(result.current[0]).toBe('computed')
  })

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))
    act(() => result.current[1](5))
    expect(result.current[0]).toBe(5)
    expect(JSON.parse(localStorage.getItem('count'))).toBe(5)
  })

  it('supports a functional updater', () => {
    const { result } = renderHook(() => useLocalStorage('count', 10))
    act(() => result.current[1]((prev) => prev + 1))
    expect(result.current[0]).toBe(11)
  })

  it('falls back to initial when stored JSON is corrupt', () => {
    localStorage.setItem('bad', '{not valid json')
    const { result } = renderHook(() => useLocalStorage('bad', 'safe'))
    expect(result.current[0]).toBe('safe')
  })

  it('keeps separate keys isolated', () => {
    const { result: a } = renderHook(() => useLocalStorage('a', 1))
    const { result: b } = renderHook(() => useLocalStorage('b', 2))
    act(() => a.current[1](99))
    expect(a.current[0]).toBe(99)
    expect(b.current[0]).toBe(2)
  })
})
