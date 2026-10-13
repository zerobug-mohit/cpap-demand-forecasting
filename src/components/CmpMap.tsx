import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { BuLens, CmpRow } from '../engine/compare'
import { fmt } from '../utils/format'
import statesGeo from '../data/india_states.json'
import { mapColor } from '../utils/mapColor'
import { ExplainHere } from './Explain'

const W = 560
const H = 620

type CmpMetric = 'unmet' | 'coverage' | 'td'
const METRICS: { key: CmpMetric; label: string }[] = [
  { key: 'unmet', label: 'Unmet need (need minus current demand)' },
  { key: 'coverage', label: 'Coverage (current demand as % of need)' },
  { key: 'td', label: 'Epidemiological need' },
]

interface Hover { row: CmpRow; bu: number; x: number; y: number; flip: boolean }

export default function CmpMap({ rows, lens }: { rows: CmpRow[]; lens: BuLens }) {
  const geo = statesGeo as any
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const [metricKey, setMetricKey] = useState<CmpMetric>('unmet')
  const path = useMemo(() => geoPath(geoMercator().fitSize([W, H], geo)), [geo])

  const buOf = (r: CmpRow) => (lens === 'existing' ? r.buExisting : r.buNormative)
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
      <ExplainHere id="cmp-map" />
      <div className="explorer-controls" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
        <label className="ctrl-inline">
          <span className="muted">Shade by</span>
          <select value={metricKey} onChange={(e) => setMetricKey(e.target.value as CmpMetric)}>
            {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
      </div>
      <p className="card-note">This map shows how the guidelines-based current demand compares with the epidemiological need in each state. A darker colour means a higher value.</p>
      <div className="map-wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="india-map" role="img" aria-label={`Map of states shaded by ${label}`}>
          {geo.features.map((f: any) => {
            const name = f.properties.state as string
            const row = byState.get(name)
            if (!row) return null
            const v = valueOf(row)
            const active = hover?.row.state === name
            return (
              <path key={name} d={path(f) || undefined} fill={isFinite(v) ? mapColor(norm(v)) : 'var(--map-none)'}
                stroke={active ? 'var(--map-edge-active)' : 'var(--map-edge)'} strokeWidth={active ? 1.4 : 0.5}
                className="state-path" onMouseMove={onMove(row)} onMouseLeave={() => setHover(null)} />
            )
          })}
        </svg>
        {hover && (
          <div className="map-tooltip" style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? 'calc(-100% - 14px)' : '14px'}, 14px)` }}>
            <div className="mt-title">{hover.row.state}{hover.row.ut && <span className="mt-ut">UT</span>}</div>
            <div className="mt-primary"><span>{label}</span><strong>{fmtVal(valueOf(hover.row))}</strong></div>
            <div className="mt-rows">
              <div><span>Epidemiological need</span><b>{fmt(hover.row.td)}</b></div>
              <div><span>Current demand (guidelines)</span><b>{fmt(hover.row.buExisting)}</b></div>
              {hover.row.installed != null && <div><span>Installed (actual)</span><b>{fmt(hover.row.installed)}</b></div>}
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
