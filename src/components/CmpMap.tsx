import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { BuLens, CmpRow } from '../engine/compare'
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

type CmpMetric = 'unmet' | 'coverage' | 'td'
const METRICS: { key: CmpMetric; label: string }[] = [
  { key: 'unmet', label: 'Unmet need (clinical − infrastructure)' },
  { key: 'coverage', label: 'Coverage (infrastructure ÷ clinical)' },
  { key: 'td', label: 'Clinical need (epidemiological)' },
]

interface Hover { row: CmpRow; bu: number; x: number; y: number; flip: boolean }

export default function CmpMap({ rows, lens }: { rows: CmpRow[]; lens: BuLens }) {
  const geo = statesGeo as any
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const [metricKey, setMetricKey] = useState<CmpMetric>('unmet')
  const path = useMemo(() => geoPath(geoMercator().fitSize([W, H], geo)), [geo])

  const buOf = (r: CmpRow) => (lens === 'existing' ? r.buExisting : r.buNormative)
  const lensLabel = lens === 'existing' ? 'current network' : 'normative'
  const valueOf = (r: CmpRow): number => {
    if (metricKey === 'td') return r.td
    if (metricKey === 'coverage') return r.td > 0 ? buOf(r) / r.td : NaN
    return Math.max(0, r.td - buOf(r)) // unmet
  }
  const fmtVal = (v: number) => (!isFinite(v) ? 'NA' : metricKey === 'coverage' ? `${Math.round(v * 100)}%` : fmt(v))

  const byState = new Map(rows.map((r) => [r.state, r]))
  const finite = rows.map(valueOf).filter((v) => isFinite(v))
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const norm = (v: number) => (max === min ? 0.5 : Math.sqrt((v - min) / (max - min)))

  const onMove = (row: CmpRow) => (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect(); if (!rect) return
    setHover({ row, bu: buOf(row), x: e.clientX - rect.left, y: e.clientY - rect.top, flip: e.clientX - rect.left > rect.width * 0.58 })
  }

  const label = METRICS.find((m) => m.key === metricKey)!.label

  return (
    <div>
      <div className="explorer-controls" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
        <label className="ctrl-inline">
          <span className="muted">Metric</span>
          <select value={metricKey} onChange={(e) => setMetricKey(e.target.value as CmpMetric)}>
            {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
      </div>
      <p className="card-note">Comparing infrastructure <strong>{lensLabel}</strong> against epidemiological clinical need, by state. Darker = higher value.</p>
      <div className="map-wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="india-map" role="img" aria-label={`Comparison choropleth — ${label}`}>
          {geo.features.map((f: any) => {
            const name = f.properties.state as string
            const row = byState.get(name)
            if (!row) return null
            const v = valueOf(row)
            const active = hover?.row.state === name
            return (
              <path key={name} d={path(f) || undefined} fill={isFinite(v) ? scaleColor(norm(v)) : '#e7ebee'}
                stroke={active ? '#0a2740' : '#ffffff'} strokeWidth={active ? 1.4 : 0.5}
                className="state-path" onMouseMove={onMove(row)} onMouseLeave={() => setHover(null)} />
            )
          })}
        </svg>
        {hover && (
          <div className="map-tooltip" style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? 'calc(-100% - 14px)' : '14px'}, 14px)` }}>
            <div className="mt-title">{hover.row.state}{hover.row.ut && <span className="mt-ut">UT</span>}</div>
            <div className="mt-primary"><span>{label}</span><strong>{fmtVal(valueOf(hover.row))}</strong></div>
            <div className="mt-rows">
              <div><span>Clinical need</span><b>{fmt(hover.row.td)}</b></div>
              <div><span>{lensLabel} (selected)</span><b>{fmt(hover.bu)}</b></div>
              <div><span>Current network</span><b>{fmt(hover.row.buExisting)}</b></div>
              <div><span>Normative</span><b>{fmt(hover.row.buNormative)}</b></div>
            </div>
          </div>
        )}
      </div>
      <div className="map-legend">
        <span className="muted">{fmtVal(min)}</span>
        <span className="legend-bar" />
        <span className="muted">{fmtVal(max)}</span>
        <span className="legend-metric">{label}</span>
      </div>
    </div>
  )
}
