// An interactive black-&-white ink globe. Real continents (Natural Earth 110m)
// projected with d3-geo's orthographic projection; drag to spin. A country a forest
// lives on fills in with ink/hatch as it grows (∝ trees / plot capacity), and the
// ocean around its coast tints blue gradually — the one accent colour. In select
// mode, tapping a country picks it as the next forest's home.

import { useMemo, useRef, useState } from 'react'
import { geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'
import { treesInForest, usedCountryIds, PLOT_CAPACITY } from '../utils/world.js'

// Country features — computed once (the topojson never changes).
const FEATURES = feature(worldTopo, worldTopo.objects.countries).features

export default function Globe({
  forests = [],
  totalTrees = 0,
  selectable = false,
  onPick,
  size = 320,
}) {
  const S = size
  const [rotation, setRotation] = useState([-8, -18]) // [λ, φ]
  const [hover, setHover] = useState(null)
  const drag = useRef(null)

  const projection = useMemo(
    () => geoOrthographic().translate([S / 2, S / 2]).scale(S / 2 - 6).clipAngle(90),
    [S],
  )

  // countryId → progress (0..1) for forested countries.
  const progressMap = useMemo(() => {
    const m = new Map()
    for (const f of forests) {
      if (!f) continue
      m.set(String(f.countryId), treesInForest(f, totalTrees) / PLOT_CAPACITY)
    }
    return m
  }, [forests, totalTrees])

  const used = useMemo(() => usedCountryIds(forests), [forests])

  // Recompute path strings for the current rotation. Backface countries clip to ''.
  const paths = useMemo(() => {
    projection.rotate(rotation)
    const path = geoPath(projection)
    return FEATURES.map((f) => ({ id: String(f.id), name: f.properties?.name ?? '', d: path(f) || '' }))
  }, [rotation, projection])

  function onPointerDown(e) {
    drag.current = { x: e.clientX, y: e.clientY, rot: rotation, moved: false }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ }
  }
  function onPointerMove(e) {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    // Only a real drag counts — ordinary clicks jitter a few px and must NOT be
    // treated as a drag (that would cancel the country pick).
    if (Math.abs(dx) + Math.abs(dy) > 8) drag.current.moved = true
    const k = 0.42
    const [l0, p0] = drag.current.rot
    setRotation([l0 + dx * k, Math.max(-90, Math.min(90, p0 - dy * k))])
  }

  // A tap (press+release without a drag) picks the country under the release
  // point. Doing this on pointer-up avoids the flaky click/setTimeout race.
  function endGesture(e, allowPick) {
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* noop */ }
    const d = drag.current
    drag.current = null
    if (!allowPick || !d || d.moved || !selectable || !onPick) return
    const path = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.globe-country')
    if (!path) return
    const id = path.dataset.cid
    if (!id || id === 'undefined' || used.has(id)) return // no id / already a forest
    onPick({ id, name: path.dataset.name || '' })
  }
  function onPointerUp(e) {
    endGesture(e, true)
  }
  function onPointerLeave(e) {
    endGesture(e, false) // leaving mid-press cancels, never picks
  }

  const R = S / 2 - 6

  return (
    <div className={`globe ${selectable ? 'is-selectable' : ''}`} style={{ width: S, height: S }}>
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className="globe-svg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <defs>
          {/* hand-drawn wobble for coastlines + rim */}
          <filter id="globe-sketch" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.021" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* soft spread for the blue coastal halos */}
          <filter id="globe-sea-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
          {/* diagonal ink hatching */}
          <pattern id="globe-hatch" width="4.6" height="4.6" patternUnits="userSpaceOnUse" patternTransform="rotate(34)">
            <line className="globe-hatch-line" x1="0" y1="0" x2="0" y2="4.6" />
          </pattern>
          {/* denser hatch toward the shadowed (lower-right) side */}
          <radialGradient id="globe-shade-grad" cx="0.66" cy="0.7" r="0.72">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="globe-shade-m">
            <rect x="0" y="0" width={S} height={S} fill="url(#globe-shade-grad)" />
          </mask>
          <clipPath id="globe-clip">
            <circle cx={S / 2} cy={S / 2} r={R} />
          </clipPath>
        </defs>

        {/* ocean disc (paper / sphere) */}
        <circle className="globe-ocean" cx={S / 2} cy={S / 2} r={R} />

        {/* blue coastal halos — blurred blue copies of forested countries, under the
            land, so blue only survives in the ocean around each coast */}
        <g clipPath="url(#globe-clip)" pointerEvents="none">
          <g filter="url(#globe-sea-blur)">
            {paths.map((p, i) => {
              const progress = progressMap.get(p.id)
              if (!p.d || progress == null || progress <= 0) return null
              return (
                <path key={i} className="globe-sea-halo" d={p.d} opacity={Math.min(0.85, progress)} />
              )
            })}
          </g>
        </g>

        {/* countries — wobbled for a sketched feel */}
        <g filter="url(#globe-sketch)">
          {/* green fill for forested land: light green (sparse) → deep green (full) */}
          {paths.map((p, i) => {
            const progress = progressMap.get(p.id)
            if (!p.d || progress == null) return null
            const pct = Math.round(progress * 100)
            return (
              <path
                key={`g${i}`}
                className="globe-forest-fill"
                d={p.d}
                style={{ fill: `color-mix(in oklab, var(--globe-forest-light), var(--globe-forest-deep) ${pct}%)` }}
              />
            )
          })}
          {/* ink coastlines + faint hatch texture on top (all land) */}
          {paths.map((p, i) => {
            if (!p.d) return null
            const isHover = selectable && hover === p.id && !used.has(p.id)
            return (
              <path
                key={i}
                d={p.d}
                className={`globe-country${isHover ? ' is-hover' : ''}`}
                data-cid={p.id}
                data-name={p.name}
                onPointerEnter={selectable ? () => setHover(p.id) : undefined}
              >
                <title>{p.name}</title>
              </path>
            )
          })}
        </g>

        {/* cross-hatch shading on the shadowed side */}
        <circle
          cx={S / 2}
          cy={S / 2}
          r={R}
          fill="url(#globe-hatch)"
          mask="url(#globe-shade-m)"
          opacity="0.6"
          pointerEvents="none"
        />

        {/* sketched rim */}
        <circle className="globe-rim" cx={S / 2} cy={S / 2} r={R} filter="url(#globe-sketch)" pointerEvents="none" />
      </svg>
    </div>
  )
}
