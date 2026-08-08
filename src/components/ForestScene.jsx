// The isometric forest plot: a raised diamond slab of parchment ground with
// hand-drawn ink trees placed on a grid and drawn back-to-front. The plot grows
// as the forest does. Everything derives from the seeded `plants` list.

import { useMemo } from 'react'
import Plant from './ForestPlants.jsx'
import { mulberry32, range } from '../utils/rng.js'

const W = 960
const H = 560
const TW = 60 // iso tile width
const TH = 30 // iso tile height
const SLAB = 26 // slab thickness
const CX = W / 2
const CY = H * 0.58

function usePrefersReducedMotion() {
  return useMemo(
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
    [],
  )
}

/** Seeded Fisher–Yates shuffle of [0..n-1]. */
function shuffledIndices(n, seed) {
  const arr = Array.from({ length: n }, (_, i) => i)
  const rand = mulberry32(seed)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function ForestScene({ plants, colorIndex = 0 }) {
  const reduceMotion = usePrefersReducedMotion()

  const { placed, plot } = useMemo(() => {
    const count = plants.length
    // Grid grows with the forest, ~70% filled so there are natural clearings.
    const G = Math.max(4, Math.min(12, Math.ceil(Math.sqrt(Math.max(count, 1) / 0.7))))
    const E = G - 1
    const oy = CY - (E * TH) / 2
    const cell = (idx) => {
      const col = idx % G
      const row = Math.floor(idx / G)
      return {
        col,
        row,
        x: CX + (col - row) * (TW / 2),
        y: oy + (col + row) * (TH / 2),
      }
    }

    // Assign plants to a stable, scattered subset of cells.
    const order = shuffledIndices(G * G, 909 + G)
    const density = Math.max(0.72, Math.min(1.02, 1.08 - (G - 4) * 0.03))
    const placed = plants.map((p, i) => {
      const c = cell(order[i % order.length])
      const rand = mulberry32((p.seed ^ 0x5bd1e995) >>> 0)
      const depth = E > 0 ? (c.col + c.row) / (2 * E) : 0.5
      const scale = density * (0.86 + depth * 0.22) * range(rand, 0.96, 1.06)
      const swayDelay = range(rand, 0, 6)
      return { p, x: c.x, y: c.y, scale, order: c.col + c.row, sy: c.y }
    })
    // Painter's order: far (small col+row) first, near last.
    placed.sort((a, b) => a.order - b.order || a.sy - b.sy)

    // Plot slab geometry.
    const halfW = (E * TW) / 2 + TW * 0.7
    const halfH = (E * TH) / 2 + TH * 0.7
    const plot = {
      top: [CX, CY - halfH],
      right: [CX + halfW, CY],
      bottom: [CX, CY + halfH],
      left: [CX - halfW, CY],
      halfW,
      halfH,
    }
    return { placed, plot }
  }, [plants])

  const { top, right, bottom, left } = plot
  const poly = (pts) => pts.map((p) => p.join(',')).join(' ')

  return (
    <div className={`scene-wrap lvl-${colorIndex}`}>
      <svg
        className="scene-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="An isometric forest plot that grows as you focus"
      >
        {/* drop shadow beneath the slab */}
        <ellipse
          className="fp-slab-shadow"
          cx={CX}
          cy={bottom[1] + SLAB * 0.5}
          rx={plot.halfW * 0.98}
          ry={plot.halfH * 0.42}
        />

        {/* slab sides (thickness) */}
        <polygon
          className="fp-plot-side-d"
          points={poly([left, bottom, [bottom[0], bottom[1] + SLAB], [left[0], left[1] + SLAB]])}
        />
        <polygon
          className="fp-plot-side"
          points={poly([bottom, right, [right[0], right[1] + SLAB], [bottom[0], bottom[1] + SLAB]])}
        />
        {/* slab top */}
        <polygon className="fp-plot-top fp-ink-s" points={poly([top, right, bottom, left])} strokeWidth={1.6} strokeLinejoin="round" />
        {/* a faint centreline sheen on the top face */}
        <polygon
          className="fp-plot-top-2"
          points={poly([top, [(top[0] + right[0]) / 2, (top[1] + right[1]) / 2], bottom, [(top[0] + left[0]) / 2, (top[1] + left[1]) / 2]])}
          opacity="0.5"
        />

        {/* trees */}
        <g>
          {placed.map(({ p, x, y, scale, swayDelay }) => (
            <g key={p.id} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
              <Plant plant={p} swayDelay={swayDelay} reduceMotion={reduceMotion} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
