/*
  chime.js — a single, gentle two-note bell played when a phase completes.
  Synthesized in-browser with the Web Audio API (no audio files).

  The AudioContext is created lazily on first use. Because the timer is always
  started by a user gesture (clicking Start / pressing Space), the context is
  allowed to produce sound by the time a phase finishes.
*/

let ctx = null

function getContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Play a soft bell — two sine tones with a light overtone and gentle decay. */
export function playChime() {
  const audio = getContext()
  if (!audio) return

  const now = audio.currentTime
  const notes = [
    { freq: 660, delay: 0 },
    { freq: 880, delay: 0.18 },
  ]

  for (const { freq, delay } of notes) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq

    // A quiet overtone gives it a bell-like timbre.
    const partial = audio.createOscillator()
    partial.type = 'sine'
    partial.frequency.value = freq * 2.01
    const partialGain = audio.createGain()
    partialGain.gain.value = 0.25

    const t0 = now + delay
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(0.3, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6)

    osc.connect(gain)
    partial.connect(partialGain).connect(gain)
    gain.connect(audio.destination)

    osc.start(t0)
    partial.start(t0)
    osc.stop(t0 + 1.7)
    partial.stop(t0 + 1.7)
  }
}
