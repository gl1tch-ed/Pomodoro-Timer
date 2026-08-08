// Hand-authored, ink-illustration trees for the isometric forest plot.
// Style: warm sepia fills, dark ink outlines, light hatching + scalloped edges
// — an old-map / engraving look. Colours come from CSS classes (.fp-sepia-*,
// .fp-ink, .fp-ink-s, .fp-shadow) so fill/stroke resolve var() and stay
// theme-aware (SVG presentation attributes don't resolve var()).
//
// Every plant is drawn in local space with its BASE at (0, 0), growing upward
// (negative y). The scene translates/scales each onto its isometric tile.

import { mulberry32, range, pick } from '../utils/rng.js'

const TREE_SPECIES = ['columnar', 'roundA', 'roundB', 'roundA', 'bare']
const SAPLING_SPECIES = ['shrub', 'shrub', 'stump']

/** A soft cast shadow on the ground (offset for a low, warm light). */
function Shadow({ rx = 15, ry = 5 }) {
  return <ellipse className="fp-shadow" cx={rx * 0.25} cy={1.5} rx={rx} ry={ry} />
}

/** Tall, flame-shaped conifer/cypress with vertical hatching. */
function Columnar(rand) {
  const h = range(rand, 56, 72)
  const w = range(rand, 17, 24)
  const tip = -h
  const body = `M ${-w / 2} 0
    C ${-w * 0.62} ${-h * 0.34}, ${-w * 0.28} ${-h * 0.78}, 0 ${tip}
    C ${w * 0.28} ${-h * 0.78}, ${w * 0.62} ${-h * 0.34}, ${w / 2} 0 Z`
  const hatch = []
  const n = 4
  for (let i = 0; i < n; i++) {
    const fx = (i / (n - 1) - 0.5) * w * 0.7
    hatch.push(
      <path
        key={i}
        className="fp-ink-s"
        d={`M ${fx} ${-h * 0.12} C ${fx * 1.2} ${-h * 0.4}, ${fx * 0.6} ${-h * 0.7}, ${fx * 0.2} ${-h * 0.9}`}
        fill="none"
        strokeWidth={1}
        strokeOpacity={0.45}
        strokeLinecap="round"
      />,
    )
  }
  return (
    <>
      <Shadow rx={w * 0.7} ry={w * 0.24} />
      <rect className="fp-sepia-3" x={-1.6} y={-6} width={3.2} height={7} />
      <path className="fp-sepia-2 fp-ink-s" d={body} strokeWidth={1.7} strokeLinejoin="round" />
      {hatch}
      {/* a couple of edge notches */}
      <path className="fp-ink-s" d={`M ${-w * 0.42} ${-h * 0.5} l 4 1`} fill="none" strokeWidth={1} strokeOpacity={0.5} strokeLinecap="round" />
      <path className="fp-ink-s" d={`M ${w * 0.42} ${-h * 0.62} l -4 1`} fill="none" strokeWidth={1} strokeOpacity={0.5} strokeLinecap="round" />
    </>
  )
}

/** Cluster-of-circles broadleaf — the classic engraved "puff" bush on a trunk. */
function RoundA(rand, { trunk = true } = {}) {
  const trunkH = trunk ? range(rand, 9, 15) : 0
  const cy = -trunkH - range(rand, 15, 20)
  const R = range(rand, 14, 19)
  const count = Math.round(range(rand, 6, 9))
  const puffs = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand() * 0.6
    const rad = R * range(rand, 0.35, 0.92)
    puffs.push({
      x: Math.cos(a) * rad,
      y: cy + Math.sin(a) * rad * 0.72,
      r: range(rand, 6.5, 10.5),
    })
  }
  // center puff to fill the middle
  puffs.push({ x: range(rand, -3, 3), y: cy + 2, r: R * 0.7 })
  puffs.sort((p, q) => p.y - q.y) // back-to-front within the canopy
  return (
    <>
      <Shadow rx={R * 1.05} ry={R * 0.34} />
      {trunk && (
        <path
          className="fp-sepia-3 fp-ink-s"
          d={`M -2.4 0 L -1.6 ${-trunkH} L 1.6 ${-trunkH} L 2.4 0 Z`}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      )}
      {puffs.map((p, i) => (
        <circle key={i} className="fp-sepia-2 fp-ink-s" cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.r.toFixed(1)} strokeWidth={1.2} />
      ))}
      {/* a little shading hatch at the base of the canopy */}
      <path className="fp-ink-s" d={`M ${-R * 0.5} ${cy + R * 0.5} q ${R * 0.5} ${R * 0.25} ${R} 0`} fill="none" strokeWidth={1} strokeOpacity={0.4} strokeLinecap="round" />
    </>
  )
}

/** Single lobed canopy with internal hatching — a fuller, quieter broadleaf. */
function RoundB(rand) {
  const trunkH = range(rand, 12, 18)
  const cy = -trunkH - range(rand, 16, 20)
  const rx = range(rand, 17, 21)
  const ry = range(rand, 15, 19)
  // lobed top via a wavy path
  const top = `M ${-rx} ${cy}
    q ${-2} ${-ry} ${rx * 0.5} ${-ry * 1.05}
    q ${rx * 0.5} ${-ry * 0.35} ${rx} ${ry * 0.1}
    q ${rx * 0.4} ${ry * 1.1} ${-rx * 0.2} ${ry * 1.1}
    q ${-rx * 0.9} ${ry * 0.15} ${-rx * 0.8} ${-ry * 0.15} Z`
  const hatch = []
  for (let i = 0; i < 3; i++) {
    const yy = cy + ry * (0.1 + i * 0.4)
    hatch.push(
      <path key={i} className="fp-ink-s" d={`M ${-rx * 0.6} ${yy} q ${rx * 0.6} ${ry * 0.3} ${rx * 1.2} 0`} fill="none" strokeWidth={1} strokeOpacity={0.4} strokeLinecap="round" />,
    )
  }
  return (
    <>
      <Shadow rx={rx * 1.05} ry={rx * 0.34} />
      <path className="fp-sepia-3 fp-ink-s" d={`M -3 0 L -2 ${-trunkH} L 2 ${-trunkH} L 3 0 Z`} strokeWidth={1.4} strokeLinejoin="round" />
      <path className="fp-ink-s" d={`M -1.4 ${-trunkH * 0.5} l 0 ${trunkH * 0.4}`} fill="none" strokeWidth={0.9} strokeOpacity={0.5} />
      <path className="fp-sepia-2 fp-ink-s" d={top} strokeWidth={1.6} strokeLinejoin="round" />
      {hatch}
    </>
  )
}

/** Bare / dead tree — branching limbs and splayed roots, no foliage. */
function Bare(rand) {
  const h = range(rand, 40, 56)
  const lean = range(rand, -4, 4)
  const trunk = `M -3 0 C ${-2 + lean * 0.2} ${-h * 0.4}, ${lean} ${-h * 0.7}, ${lean * 1.2} ${-h}
    L ${lean * 1.2 + 2.4} ${-h} C ${lean + 2.4} ${-h * 0.7}, ${2 + lean * 0.2} ${-h * 0.4}, 3 0 Z`
  const limbs = []
  const branchN = Math.round(range(rand, 3, 5))
  for (let i = 0; i < branchN; i++) {
    const t = 0.45 + (i / branchN) * 0.5
    const bx = lean * t
    const by = -h * t
    const dir = i % 2 === 0 ? 1 : -1
    const len = range(rand, 10, 18) * (1 - t * 0.4)
    limbs.push(
      <path
        key={i}
        className="fp-ink-s"
        d={`M ${bx} ${by} q ${dir * len * 0.5} ${-len * 0.3} ${dir * len} ${-len * 0.7}`}
        fill="none"
        strokeWidth={2 - t}
        strokeLinecap="round"
      />,
    )
  }
  const roots = []
  for (let i = -1; i <= 1; i++) {
    roots.push(
      <path key={i} className="fp-ink-s" d={`M 0 0 q ${i * 5} 2 ${i * 9} 3`} fill="none" strokeWidth={1.6} strokeLinecap="round" />,
    )
  }
  return (
    <>
      <Shadow rx={12} ry={4} />
      {roots}
      <path className="fp-sepia-3 fp-ink-s" d={trunk} strokeWidth={1.6} strokeLinejoin="round" />
      {limbs}
    </>
  )
}

/** Low shrub — a small cluster of circles hugging the ground. */
function Shrub(rand, stage = 1) {
  const s = 0.6 + Math.max(0.1, Math.min(1, stage)) * 0.5
  const R = range(rand, 9, 13) * s
  const count = Math.round(range(rand, 4, 6))
  const puffs = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI + rand() * 0.5
    puffs.push({ x: Math.cos(a) * R * 0.7, y: -Math.abs(Math.sin(a)) * R * 0.5, r: range(rand, 5, 8) * s })
  }
  puffs.sort((p, q) => p.y - q.y)
  return (
    <>
      <Shadow rx={R * 1.1} ry={R * 0.3} />
      {puffs.map((p, i) => (
        <circle key={i} className="fp-sepia-2 fp-ink-s" cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.r.toFixed(1)} strokeWidth={1.1} />
      ))}
    </>
  )
}

/** A cut stump with growth rings and little roots. */
function Stump(rand) {
  const w = range(rand, 8, 11)
  const h = range(rand, 8, 12)
  return (
    <>
      <Shadow rx={w * 1.2} ry={w * 0.4} />
      <path className="fp-sepia-3 fp-ink-s" d={`M ${-w} 0 L ${-w * 0.8} ${-h} L ${w * 0.8} ${-h} L ${w} 0 Z`} strokeWidth={1.4} strokeLinejoin="round" />
      <ellipse className="fp-sepia-1 fp-ink-s" cx={0} cy={-h} rx={w * 0.8} ry={w * 0.34} strokeWidth={1.3} />
      <ellipse className="fp-ink-s" cx={0} cy={-h} rx={w * 0.45} ry={w * 0.19} fill="none" strokeWidth={0.9} strokeOpacity={0.6} />
      <path className="fp-ink-s" d={`M ${-w} 0 q -4 2 -6 2 M ${w} 0 q 4 2 6 2`} fill="none" strokeWidth={1.4} strokeLinecap="round" />
    </>
  )
}

const DRAW = { columnar: Columnar, roundA: RoundA, roundB: RoundB, bare: Bare, shrub: Shrub, stump: Stump }

/**
 * A single plant. `plant` = { kind, seed, stage }. The scene positions it.
 * Foliage sways gently unless reduced motion is requested.
 */
export default function Plant({ plant, swayDelay = 0, reduceMotion = false }) {
  const rand = mulberry32(plant.seed)
  const isTree = plant.kind === 'tree'
  const species = pick(rand, isTree ? TREE_SPECIES : SAPLING_SPECIES)
  const flip = rand() < 0.5 ? -1 : 1
  const jitter = range(rand, 0.94, 1.06)

  const draw = DRAW[species]
  const body = species === 'shrub' ? draw(rand, plant.stage ?? 1) : draw(rand)

  return (
    <g transform={`scale(${(flip * jitter).toFixed(3)} ${jitter.toFixed(3)})`}>
      <g
        className={reduceMotion || species === 'bare' || species === 'stump' ? '' : 'fp-sway'}
        style={reduceMotion ? undefined : { animationDelay: `${swayDelay}s` }}
      >
        {body}
      </g>
    </g>
  )
}
