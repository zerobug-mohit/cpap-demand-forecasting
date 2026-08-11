import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { Computed2 } from '../engine/method2'
import type { Metric2 } from '../engine/metrics2'
import { fmtMetric } from '../engine/metrics2'
import { fmt } from '../utils/format'
import statesGeo from '../data/india_states.json'

const W = 560
const H = 620
const STOPS = ['#e3eef2', '#8fbcc6', '#0e7e92', '#123a5e']
function hexToRgb(h: string) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
function mix(a: string, b: string, t: number) {
  const [ar, ag, ab] = hexToRgb(a); const [br, bg, bb] = hexToRgb(b)
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`
}
function scaleColor(t: number) {
  const c = Math.max(0, Math.min(1, t)); const seg = c * (STOPS.length - 1)
  const i = Math.min(STOPS.length - 2, Math.floor(seg)); return mix(STOPS[i], STOPS[i + 1], seg - i)
}

interface Hover { row: Computed2; x: number; y: number; flip: boolean }

export default function M2Map({ rows, metric }: { rows: Computed2[]; metric: Metric2 }) {
  const geo = statesGeo as any
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const path = useMemo(() => geoPath(geoMercator().fitSize([W, H], geo)), [geo])

  const byState = new Map(rows.map((r) => [r.state, r]))
  const finite = rows.map((r) => metric.get(r)).filter((v) => isFinite(v))
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const norm = (v: number) => (max === min ? 0.5 : Math.sqrt((v - min) / (max - min)))

  const onMove = (row: Computed2) => (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect(); if (!rect) return
    setHover({ row, x: e.clientX - rect.left, y: e.clientY - rect.top, flip: e.clientX - rect.left > rect.width * 0.58 })
  }

  return (
    <div>
      <p className="card-note">
        State-wise choropleth, shaded by the selected metric. States without a value for a metric (e.g. NMR in
        smaller states/UTs) are shown in grey. Hover for detail.
      </p>
      <div className="map-wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="india-map" role="img" aria-label={`India choropleth — ${metric.label}`}>
          {geo.features.map((f: any) => {
            const name = f.properties.state as string
            const row = byState.get(name)
            if (!row) return null
            const v = metric.get(row)
            const active = hover?.row.state === name
            const fill = isFinite(v) ? scaleColor(norm(v)) : '#e7ebee'
            return (
              <path key={name} d={path(f) || undefined} fill={fill}
                stroke={active ? '#0a2740' : '#ffffff'} strokeWidth={active ? 1.4 : 0.5}
                className="state-path" onMouseMove={onMove(row)} onMouseLeave={() => setHover(null)} />
            )
          })}
        </svg>

        {hover && (
          <div className="map-tooltip" style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? 'calc(-100% - 14px)' : '14px'}, 14px)` }}>
            <div className="mt-title">{hover.row.state}{hover.row.ut && <span className="mt-ut">UT</span>}</div>
            <div className="mt-primary"><span>{metric.label}</span><strong>{fmtMetric(metric.kind, metric.get(hover.row))}</strong></div>
            <div className="mt-rows">
              <div><span>Inst. births</span><b>{fmt(hover.row.instBirths)}</b></div>
              <div><span>LBW %</span><b>{hover.row.lbw != null ? hover.row.lbw.toFixed(1) : 'NA'}</b></div>
              <div><span>NMR</span><b>{hover.row.nmr != null ? hover.row.nmr : 'NA'}</b></div>
              <div><span>Risk index</span><b>{hover.row.index.toFixed(2)}</b></div>
              <div><span>Eligible</span><b>{fmt(hover.row.eligible)}</b></div>
              <div><span>CPAP req.</span><b>{fmt(hover.row.gross)}</b></div>
            </div>
          </div>
        )}
      </div>

      <div className="map-legend">
        <span className="muted">{fmtMetric(metric.kind, min)}</span>
        <span className="legend-bar" />
        <span className="muted">{fmtMetric(metric.kind, max)}</span>
        <span className="legend-metric">{metric.label}</span>
      </div>
    </div>
  )
}
