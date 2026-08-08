import { describe, it, expect } from 'vitest'
import { QUOTES, quoteFor } from './quotes.js'

describe('QUOTES', () => {
  it('is a non-empty list of non-empty strings', () => {
    expect(Array.isArray(QUOTES)).toBe(true)
    expect(QUOTES.length).toBeGreaterThan(0)
    for (const q of QUOTES) {
      expect(typeof q).toBe('string')
      expect(q.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('quoteFor', () => {
  it('is deterministic for a given seed', () => {
    expect(quoteFor('forest-1')).toBe(quoteFor('forest-1'))
  })

  it('always returns a quote from the list', () => {
    for (const seed of ['a', 'forest-42', 12345, 'zzz', '']) {
      expect(QUOTES).toContain(quoteFor(seed))
    }
  })
})
