import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { Computed2 } from '../engine/method2'
import type { Metric2 } from '../engine/metrics2'
import { fmtMetric } from '../engine/metrics2'
import { fmt } from '../utils/format'
import statesGeo from '../data/india_states.json'
import { mapColor } from '../utils/mapColor'
import { ExplainHere } from './Explain'

const W = 560
const H = 620

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
      <ExplainHere id="td-rds-map" />
      <p className="card-note">
        Each state is shaded by the selected metric. States with no value for a metric, such as the newborn death
        rate in smaller states and union territories, are shown in grey. Hover over a state to see more detail.
      </p>
      <div className="map-wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="india-map" role="img" aria-label={`Map of India shaded by ${metric.label}`}>
          {geo.features.map((f: any) => {
            const name = f.properties.state as string
            const row = byState.get(name)
            if (!row) return null
            const v = metric.get(row)
            const active = hover?.row.state === name
            const fill = isFinite(v) ? mapColor(norm(v)) : 'var(--map-none)'
            return (
              <path key={name} d={path(f) || undefined} fill={fill}
                stroke={active ? 'var(--map-edge-active)' : 'var(--map-edge)'} strokeWidth={active ? 1.4 : 0.5}
                className="state-path" onMouseMove={onMove(row)} onMouseLeave={() => setHover(null)} />
            )
          })}
        </svg>

        {hover && (
          <div className="map-tooltip" style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? 'calc(-100% - 14px)' : '14px'}, 14px)` }}>
            <div className="mt-title">{hover.row.state}{hover.row.ut && <span className="mt-ut">UT</span>}</div>
            <div className="mt-primary"><span>{metric.label}</span><strong>{fmtMetric(metric.kind, metric.get(hover.row))}</strong></div>
            <div className="mt-rows">
              <div><span>Births in facilities</span><b>{fmt(hover.row.instBirths)}</b></div>
              <div><span>Low birth weight %</span><b>{hover.row.lbw != null ? hover.row.lbw.toFixed(1) : 'NA'}</b></div>
              <div><span>Newborn deaths per 1,000</span><b>{hover.row.nmr != null ? hover.row.nmr : 'NA'}</b></div>
              <div><span>Need score</span><b>{hover.row.index.toFixed(2)}</b></div>
              <div><span>Likely to need CPAP</span><b>{fmt(hover.row.eligible)}</b></div>
              <div><span>CPAP devices needed</span><b>{fmt(hover.row.gross)}</b></div>
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
