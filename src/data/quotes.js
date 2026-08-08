// Original short lines on consistency & focus (no copyrighted text).
// One is shown per forest, chosen deterministically from its id.

import { hashSeed } from '../utils/rng.js'

export const QUOTES = [
  'Small steps, taken daily, become forests.',
  'Consistency is quiet, but it moves mountains.',
  'A little today, again tomorrow — that’s how roots grow deep.',
  'Showing up is most of the work.',
  'Momentum loves a routine.',
  'You don’t need a perfect day, just the next honest hour.',
  'The forest doesn’t rush, yet it never stops.',
  'Every focused hour plants something that outlasts the day.',
  'Progress hides in the days that feel ordinary.',
  'Rhythm beats intensity over a long enough season.',
  'Water it daily; growth is a byproduct of returning.',
  'One tree is luck; a forest is a habit.',
  'Begin again, gently, as many times as it takes.',
  'A streak is built one unremarkable day at a time.',
  'Focus is a muscle; consistency is the training.',
  'Slow is smooth, and smooth grows tall.',
  'What you repeat, you become — so repeat the good.',
  'Patience plants; persistence harvests.',
  'Keep the pace kind and the practice constant.',
  'Deep roots are grown on ordinary afternoons.',
]

/** Deterministic quote for a given seed (e.g. a forest id). */
export function quoteFor(seed) {
  return QUOTES[hashSeed(seed) % QUOTES.length]
}
