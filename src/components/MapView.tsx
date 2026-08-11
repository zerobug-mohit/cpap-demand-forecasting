import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { ComputedRow } from '../engine/method1'
import type { Metric } from '../engine/metrics'
import { fmt } from '../utils/format'
import statesGeo from '../data/india_states.json'

interface Props {
  rows: ComputedRow[]
  metric: Metric
}

const W = 560
const H = 620

const STOPS = ['#e3eef2', '#8fbcc6', '#0e7e92', '#123a5e']
function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function mix(a: string, b: string, t: number) {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`
}
function scaleColor(t: number) {
  const c = Math.max(0, Math.min(1, t))
  const seg = c * (STOPS.length - 1)
  const i = Math.min(STOPS.length - 2, Math.floor(seg))
  return mix(STOPS[i], STOPS[i + 1], seg - i)
}

interface Hover {
  row: ComputedRow
  x: number
  y: number
  flip: boolean
}

export default function MapView({ rows, metric }: Props) {
  const geo = statesGeo as any
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  const path = useMemo(() => geoPath(geoMercator().fitSize([W, H], geo)), [geo])

  const byState = new Map(rows.map((r) => [r.state, r]))
  const values = rows.map((r) => metric.get(r))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const norm = (v: number) => (max === min ? 0.5 : Math.sqrt((v - min) / (max - min)))

  const onMove = (row: ComputedRow) => (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setHover({ row, x, y, flip: x > rect.width * 0.58 })
  }

  return (
    <div>
      <p className="card-note">
        State-wise choropleth, shaded by the selected metric. Hover a state for its full detail.
      </p>

      <div className="map-wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="india-map" role="img" aria-label={`India state choropleth — ${metric.label}`}>
          {geo.features.map((f: any) => {
            const name = f.properties.state as string
            const row = byState.get(name)
            if (!row) return null
            const v = metric.get(row)
            const active = hover?.row.state === name
            return (
              <path
                key={name}
                d={path(f) || undefined}
                fill={scaleColor(norm(v))}
                stroke={active ? '#0a2740' : '#ffffff'}
                strokeWidth={active ? 1.4 : 0.5}
                className="state-path"
                onMouseMove={onMove(row)}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </svg>

        {hover && (
          <div
            className="map-tooltip"
            style={{
              left: hover.x,
              top: hover.y,
              transform: `translate(${hover.flip ? 'calc(-100% - 14px)' : '14px'}, 14px)`,
            }}
          >
            <div className="mt-title">
              {hover.row.state}
              {hover.row.ut && <span className="mt-ut">UT</span>}
            </div>
            <div className="mt-primary">
              <span>{metric.label}</span>
              <strong>{fmt(metric.get(hover.row))}</strong>
            </div>
            <div className="mt-rows">
              <div><span>SNCUs</span><b>{fmt(hover.row.sncu)}</b></div>
              <div><span>NBSUs</span><b>{fmt(hover.row.nbsu)}</b></div>
              <div><span>Live births</span><b>{fmt(hover.row.births)}</b></div>
              <div><span>CPAP · guidelines</span><b>{fmt(hover.row.asisCpap)}</b></div>
              <div><span>CPAP · norm.</span><b>{fmt(hover.row.normCpap)}</b></div>
              <div><span>Gap</span><b className="mt-gap">{fmt(hover.row.cpapGap)}</b></div>
            </div>
          </div>
        )}
      </div>

      <div className="map-legend">
        <span className="muted">{fmt(min)}</span>
        <span className="legend-bar" />
        <span className="muted">{fmt(max)}</span>
        <span className="legend-metric">{metric.label}</span>
      </div>
    </div>
  )
}
