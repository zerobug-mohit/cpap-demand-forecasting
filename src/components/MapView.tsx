import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { ComputedRow } from '../engine/method1'
import type { Metric } from '../engine/metrics'
import { fmtMetric } from '../engine/metrics2'
import { fmt } from '../utils/format'
import statesGeo from '../data/india_states.json'
import { mapColor } from '../utils/mapColor'

interface Props {
  rows: ComputedRow[]
  metric: Metric
}

const W = 560
const H = 620


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
  const finite = rows.map((r) => metric.get(r)).filter((v) => isFinite(v))
  const min = finite.length ? Math.min(...finite) : 0
  const max = finite.length ? Math.max(...finite) : 1
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
        This map shades each state by the value you choose above. Hover over a state to see its full details.
      </p>

      <div className="map-wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="india-map" role="img" aria-label={`Map of India with each state shaded by ${metric.label}`}>
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
                fill={isFinite(v) ? mapColor(norm(v)) : 'var(--map-none)'}
                stroke={active ? 'var(--map-edge-active)' : 'var(--map-edge)'}
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
              <strong>{fmtMetric(metric.kind, metric.get(hover.row))}</strong>
            </div>
            <div className="mt-rows">
              <div><span>SNCUs</span><b>{fmt(hover.row.sncu)}</b></div>
              <div><span>NBSUs</span><b>{fmt(hover.row.nbsu)}</b></div>
              <div><span>Live births</span><b>{fmt(hover.row.births)}</b></div>
              <div><span>Births in facilities</span><b>{fmt(hover.row.instBirths)}</b></div>
              <div><span>CPAP, current demand</span><b>{fmt(hover.row.asisCpap)}</b></div>
              <div><span>Installed (actual)</span><b>{hover.row.installed != null ? fmt(hover.row.installed) : 'NA'}</b></div>
              <div><span>Gap: current minus installed</span><b className="mt-gap">{hover.row.gapGuidInstalled != null ? fmt(hover.row.gapGuidInstalled) : 'NA'}</b></div>
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
