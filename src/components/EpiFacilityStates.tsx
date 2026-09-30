import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { M3Norms, StateFacRow } from '../engine/method3'
import { computeM3ByState } from '../engine/method3'
import { FACILITIES_BY_STATE } from '../data/states3'
import { fmt } from '../utils/format'
import SourceNote from './SourceNote'
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

type MetricKey = 'devices' | 'facilities' | 'dh' | 'sdh' | 'chc' | 'mc'
const METRICS: { key: MetricKey; label: string; get: (r: StateFacRow) => number }[] = [
  { key: 'devices', label: 'CPAP devices · facility-based need', get: (r) => r.devices },
  { key: 'facilities', label: 'Facilities (DH + SDH + CHC + MC)', get: (r) => r.dh + r.sdh + r.chc + r.mc },
  { key: 'dh', label: 'District Hospitals', get: (r) => r.dh },
  { key: 'sdh', label: 'Sub-District Hospitals', get: (r) => r.sdh },
  { key: 'chc', label: 'Community Health Centres', get: (r) => r.chc },
  { key: 'mc', label: 'Govt medical colleges', get: (r) => r.mc },
]

type SortKey = 'state' | 'dh' | 'sdh' | 'chc' | 'mc' | 'deliveries' | 'devices'

interface Hover { row: StateFacRow; x: number; y: number; flip: boolean }

export default function EpiFacilityStates({ norms }: { norms: M3Norms }) {
  const { rows, totals } = useMemo(() => computeM3ByState(norms, FACILITIES_BY_STATE), [norms])
  const [view, setView] = useState<'map' | 'table'>('map')
  const [metricKey, setMetricKey] = useState<MetricKey>('devices')
  const [sortKey, setSortKey] = useState<SortKey>('devices')
  const [asc, setAsc] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  const metric = METRICS.find((m) => m.key === metricKey)!
  const geo = statesGeo as any
  const path = useMemo(() => geoPath(geoMercator().fitSize([W, H], geo)), [geo])
  const byState = useMemo(() => new Map(rows.map((r) => [r.state, r])), [rows])
  const vals = rows.map((r) => metric.get(r))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const norm = (v: number) => (max === min ? 0.5 : Math.sqrt((v - min) / (max - min)))

  const onMove = (row: StateFacRow) => (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect(); if (!rect) return
    const x = e.clientX - rect.left; const y = e.clientY - rect.top
    setHover({ row, x, y, flip: x > rect.width * 0.58 })
  }

  const val = (r: StateFacRow) => (sortKey === 'state' ? 0 : (r[sortKey] as number))
  const sorted = [...rows].sort((a, b) => {
    const cmp = sortKey === 'state' ? a.state.localeCompare(b.state) : val(a) - val(b)
    return asc ? cmp : -cmp
  })
  const onSort = (k: SortKey) => { if (k === sortKey) setAsc(!asc); else { setSortKey(k); setAsc(k === 'state') } }

  const COLS: { key: SortKey; label: string; get: (r: StateFacRow) => number; cls?: string }[] = [
    { key: 'dh', label: 'DH', get: (r) => r.dh },
    { key: 'sdh', label: 'SDH', get: (r) => r.sdh },
    { key: 'chc', label: 'CHC', get: (r) => r.chc },
    { key: 'mc', label: 'Med. Coll.', get: (r) => r.mc },
    { key: 'deliveries', label: 'Deliveries', get: (r) => r.deliveries },
    { key: 'devices', label: 'CPAP devices', get: (r) => r.devices, cls: 'cell-strong' },
  ]

  return (
    <div className="card">
      <div className="explorer-head">
        <div>
          <h2 style={{ marginBottom: 2 }}>State-wise variation</h2>
          <p className="card-note" style={{ margin: 0 }}>
            This shows the facility-based need for each state. It depends on how many District Hospitals, Sub-District
            Hospitals, CHCs and government medical colleges the state has. The group split, average deliveries and FBNC
            norm from the left are the same for every state, so the differences come from the facility counts.
          </p>
        </div>
      </div>

      <div className="explorer-head" style={{ marginTop: 10 }}>
        <div className="toggle-group" role="tablist" aria-label="View">
          {(['map', 'table'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
              {v === 'map' ? 'Map' : 'Table'}
            </button>
          ))}
        </div>
        {view === 'map' && (
          <div className="explorer-controls">
            <label className="ctrl-inline">
              <span className="muted">Metric</span>
              <select value={metricKey} onChange={(e) => setMetricKey(e.target.value as MetricKey)}>
                {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      {view === 'map' ? (
        <div>
          <div className="map-wrap" ref={wrapRef}>
            <svg viewBox={`0 0 ${W} ${H}`} className="india-map" role="img" aria-label={`India choropleth — ${metric.label}`}>
              {geo.features.map((f: any) => {
                const name = f.properties.state as string
                const row = byState.get(name)
                if (!row) return null
                const v = metric.get(row)
                const active = hover?.row.state === name
                return (
                  <path key={name} d={path(f) || undefined} fill={scaleColor(norm(v))}
                    stroke={active ? '#0a2740' : '#ffffff'} strokeWidth={active ? 1.4 : 0.5}
                    className="state-path" onMouseMove={onMove(row)} onMouseLeave={() => setHover(null)} />
                )
              })}
            </svg>
            {hover && (
              <div className="map-tooltip" style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? 'calc(-100% - 14px)' : '14px'}, 14px)` }}>
                <div className="mt-title">{hover.row.state}</div>
                <div className="mt-primary"><span>{metric.label}</span><strong>{fmt(metric.get(hover.row))}</strong></div>
                <div className="mt-rows">
                  <div><span>District Hospitals</span><b>{fmt(hover.row.dh)}</b></div>
                  <div><span>Sub-District Hosp.</span><b>{fmt(hover.row.sdh)}</b></div>
                  <div><span>CHCs</span><b>{fmt(hover.row.chc)}</b></div>
                  <div><span>Govt med. colleges</span><b>{fmt(hover.row.mc)}</b></div>
                  <div><span>Deliveries modelled</span><b>{fmt(hover.row.deliveries)}</b></div>
                  <div><span>CPAP devices</span><b>{fmt(hover.row.devices)}</b></div>
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
      ) : (
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th className={sortKey === 'state' ? 'sorted' : ''} onClick={() => onSort('state')} title="Sort">State / UT{sortKey === 'state' ? (asc ? ' ▲' : ' ▼') : ''}</th>
                {COLS.map((c) => (
                  <th key={c.key} className={sortKey === c.key ? 'sorted' : ''} onClick={() => onSort(c.key)} title="Sort">
                    {c.label}{sortKey === c.key ? (asc ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.state}>
                  <td>{r.state}</td>
                  {COLS.map((c) => <td key={c.key} className={c.cls ?? ''}>{fmt(c.get(r))}</td>)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>India total</td>
                <td>{fmt(rows.reduce((a, r) => a + r.dh, 0))}</td>
                <td>{fmt(rows.reduce((a, r) => a + r.sdh, 0))}</td>
                <td>{fmt(rows.reduce((a, r) => a + r.chc, 0))}</td>
                <td>{fmt(rows.reduce((a, r) => a + r.mc, 0))}</td>
                <td>{fmt(totals.deliveries)}</td>
                <td className="cell-strong">{fmt(totals.devices)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <hr className="divider" />
      <SourceNote
        refs={[{ key: 'healthDynamics', page: 'Tables 6–7, p. 123–124 (as on 31 Mar 2023)' }, { key: 'nmcColleges', page: 'govt medical colleges' }]}
        note="state-wise DH · SDH · CHC (rural+urban) · govt medical colleges — sums to the national totals"
      />
    </div>
  )
}
