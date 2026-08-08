import { describe, it, expect } from 'vitest'
import { mulberry32, hashSeed, range, pick } from './rng.js'

describe('mulberry32', () => {
  it('is deterministic — same seed yields the same sequence', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    const seqA = [a(), a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    expect(a()).not.toBe(b())
  })

  it('returns floats in [0, 1)', () => {
    const rand = mulberry32(99)
    for (let i = 0; i < 1000; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('advances state between calls', () => {
    const rand = mulberry32(7)
    const first = rand()
    const second = rand()
    expect(first).not.toBe(second)
  })
})

describe('hashSeed', () => {
  it('is deterministic for the same input', () => {
    expect(hashSeed('bloom')).toBe(hashSeed('bloom'))
  })

  it('differs for different inputs', () => {
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'))
  })

  it('stringifies its input (number and string forms agree)', () => {
    expect(hashSeed(123)).toBe(hashSeed('123'))
  })

  it('returns an unsigned 32-bit integer', () => {
    const h = hashSeed('anything')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(0xffffffff)
  })
})

describe('range', () => {
  it('maps rand() output across [min, max)', () => {
    expect(range(() => 0, 10, 20)).toBe(10)
    expect(range(() => 0.5, 10, 20)).toBe(15)
  })
})

describe('pick', () => {
  const arr = ['a', 'b', 'c', 'd']

  it('selects by index derived from rand()', () => {
    expect(pick(() => 0, arr)).toBe('a')
    expect(pick(() => 0.99, arr)).toBe('d')
  })

  it('always returns a member of the array', () => {
    const rand = mulberry32(3)
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(pick(rand, arr))
    }
  })
})
