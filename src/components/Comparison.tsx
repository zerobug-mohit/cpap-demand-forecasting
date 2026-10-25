import { useMemo, useState } from 'react'
import type { Norms } from '../engine/method1'
import type { M2Norms } from '../engine/method2'
import type { M3Norms } from '../engine/method3'
import { compare } from '../engine/compare'
import type { CmpRow } from '../engine/compare'
import { fmt } from '../utils/format'
import CmpScatter from './CmpScatter'
import CmpMap from './CmpMap'
import CmpTable from './CmpTable'
import { ExplainTitle, ExplainHere, useExplain } from './Explain'

interface Props {
  m1: Norms
  m2: M2Norms
  m3: M3Norms
}

type View = 'scatter' | 'map' | 'table'
type NeedBasis = 'rds' | 'facility'

const INSTALLED_COLOR = 'var(--s-installed)'

interface Mark { key: string; label: string; value: number; color: string }

/** Single horizontal axis with a marker (line + label + value) for each approach, like the old triangulation bar. */
function MarkerBar({ marks, showLegend = true, valueOnly = false }: { marks: Mark[]; showLegend?: boolean; valueOnly?: boolean }) {
  const rawMax = Math.max(1, ...marks.map((m) => m.value))
  const max = rawMax * 1.08 // headroom so the largest marker never sits on the edge
  const pct = (v: number) => `${(Math.min(v, max) / max) * 100}%`
  // graduated fill: each band runs from the previous marker to this one, in this marker's colour
  const ordered = [...marks].sort((a, b) => a.value - b.value)
  let acc = 0
  const segs = ordered.map((m, i) => {
    const seg = { key: m.key, left: acc, width: ((m.value - acc) / max) * 100, color: m.color, first: i === 0 }
    acc = m.value
    return seg
  })
  const TIER_H = 34
  const MIN_GAP = 19 // % of width below which two labels collide → stagger onto a new tier
  const withP = marks.map((m) => ({ ...m, p: (m.value / max) * 100 }))

  const tierLast: number[] = []
  const tier: Record<string, number> = {}
  for (const m of [...withP].sort((a, b) => a.p - b.p)) {
    let t = 0
    while (tierLast[t] !== undefined && m.p - tierLast[t] < MIN_GAP) t++
    tierLast[t] = m.p
    tier[m.key] = t
  }
  const maxTier = Math.max(0, ...Object.values(tier))

  return (
    <div className="tri-wrap">
      <div className="tri-track">
        {segs.map((s) => (
          <div key={s.key} className="tri-seg" style={{ left: pct(s.left), width: `${s.width}%`, background: s.color, borderRadius: s.first ? '4px 0 0 4px' : 0 }} />
        ))}
        {withP.map((m) => {
          const align = m.p > 86 ? 'right' : m.p < 12 ? 'left' : 'center'
          const t = tier[m.key]
          const lineH = 42 + t * TIER_H
          return (
            <div key={m.key} className={`tri-mark ${align}`} style={{ left: pct(m.value), height: lineH, color: m.color }}>
              <div className="tri-mark-line" style={{ height: lineH }} />
              <div className="tri-mark-label" style={{ top: 44 + t * TIER_H }}>
                {valueOnly ? <span>{fmt(m.value)}</span> : <><span>{m.label}</span><b>{fmt(m.value)}</b></>}
              </div>
            </div>
          )
        })}
      </div>
      <div className="legend-row" style={{ marginTop: 60 + maxTier * TIER_H }}>
        {showLegend && marks.map((m) => (
          <span key={m.key}><span className="legend-dot" style={{ background: m.color }} />{m.label}</span>
        ))}
      </div>
    </div>
  )
}

export default function Comparison({ m1, m2, m3 }: Props) {
  const { rows, nat } = useMemo(() => compare(m1, m2, m3), [m1, m2, m3])
  const [scope, setScope] = useState('national')
  const [needBasis, setNeedBasis] = useState<NeedBasis>('rds')
  const [view, setView] = useState<View>('scatter')

  const sortedStates = useMemo(() => rows.map((r) => r.state).sort((a, b) => a.localeCompare(b)), [rows])
  const sel = scope === 'national' ? null : rows.find((r) => r.state === scope) ?? null

  const active = {
    guid: sel ? sel.buExisting : nat.buExisting,
    rds: sel ? sel.td : nat.td,
    fac: sel ? sel.tdFacility : nat.tdFacility,
    installed: sel ? (sel.installed ?? null) : null, // installed shown per-state only, never a national total
  }
  const scopeName = sel ? sel.state : 'India (national)'

  const marks: Mark[] = [
    { key: 'guid', label: 'Current (guidelines)', value: active.guid, color: 'var(--c-asis)' },
    { key: 'rds', label: 'RDS need', value: active.rds, color: 'var(--c-opt)' },
    { key: 'fac', label: 'Facility-based need', value: active.fac, color: 'var(--c-primary-dark)' },
    ...(active.installed != null && active.installed > 0
      ? [{ key: 'installed', label: 'Installed (actual)', value: active.installed, color: INSTALLED_COLOR }]
      : []),
  ]

  // cross-state chart rows: swap the "need" (td) to the chosen basis so the existing chart components work unchanged
  const chartRows: CmpRow[] = useMemo(
    () => rows.map((r) => ({ ...r, td: needBasis === 'facility' ? r.tdFacility : r.td })),
    [rows, needBasis],
  )
  const needLabel = needBasis === 'facility' ? 'facility-based' : 'RDS-based'

  const needEx = useExplain('cmp-need-basis')
  return (
    <>
      <div className="card lens-explainer" data-step="cmp-area">
        <ExplainHere id="cmp-scope" />
        <div className="cmp-scope">
          <label htmlFor="cmp-scope-sel">Area</label>
          <select id="cmp-scope-sel" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="national">India (national)</option>
            {sortedStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <ExplainTitle id="cmp-by-approach">Demand by approach: {scopeName}</ExplainTitle>
        <p className="card-note">
          This shows the public CPAP estimates side by side for the area you choose. It compares what today's SNCUs should
          have (the guidelines-based figure) with two separate estimates of what newborns actually need. Where
          it has been reported, it also shows the number of machines actually installed. Private-sector demand is on its
          own tab and is not included here.
        </p>
        <MarkerBar marks={marks} />
      </div>

      {(() => {
        const installedRows = rows.filter((r) => r.installed != null && r.installed > 0).sort((a, b) => b.tdFacility - a.tdFacility)
        if (installedRows.length === 0) return null
        return (
          <div className="card" data-step="cmp-installed">
            <ExplainTitle id="cmp-installed-states">States with reported installed devices</ExplainTitle>
            <p className="card-note">
              For the states that have reported how many CPAP machines are actually installed, this shows how that count
              compares with the estimates. Each state's bar uses its own scale.
            </p>
            <div className="legend-row" style={{ marginBottom: 2 }}>
              <span><span className="legend-dot" style={{ background: 'var(--c-asis)' }} />Current (guidelines)</span>
              <span><span className="legend-dot" style={{ background: 'var(--c-opt)' }} />RDS need</span>
              <span><span className="legend-dot" style={{ background: 'var(--c-primary-dark)' }} />Facility-based need</span>
              <span><span className="legend-dot" style={{ background: INSTALLED_COLOR }} />Installed (actual)</span>
            </div>
            <div className="state-bars">
              {installedRows.map((r) => (
                <div className="state-bar-row" key={r.state}>
                  <div className="state-bar-name">{r.state}</div>
                  <MarkerBar
                    showLegend={false}
                    valueOnly
                    marks={[
                      { key: 'guid', label: 'Current (guidelines)', value: r.buExisting, color: 'var(--c-asis)' },
                      { key: 'rds', label: 'RDS need', value: r.td, color: 'var(--c-opt)' },
                      { key: 'fac', label: 'Facility-based need', value: r.tdFacility, color: 'var(--c-primary-dark)' },
                      { key: 'installed', label: 'Installed (actual)', value: r.installed as number, color: INSTALLED_COLOR },
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="card" data-step="cmp-states">
        <div className="explorer-head">
          <div>
            <ExplainTitle id="cmp-by-state" style={{ marginBottom: 2 }}>By state: current demand against need</ExplainTitle>
            <p className="card-note" style={{ margin: 0 }}>
              This shows all states at once. It compares the guidelines-based current demand with the {needLabel} estimate
              of need. Where states have reported it, it also shows the machines actually installed.
            </p>
          </div>
        </div>
        <div className="explorer-head" style={{ marginTop: 10 }}>
          <div className="toggle-group" role="tablist" aria-label="View">
            {(['scatter', 'map', 'table'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                {v === 'scatter' ? 'Visual' : v === 'map' ? 'Map' : 'Table'}
              </button>
            ))}
          </div>
          <div className="explorer-controls">
            <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Need based on</span>
            <div className="series-toggle">
              <button className={needBasis === 'rds' ? 'on asis' : ''} onClick={() => setNeedBasis('rds')}>RDS prevalence</button>
              <button className={needBasis === 'facility' ? 'on norm' : ''} onClick={() => setNeedBasis('facility')}>Facility-based</button>
            </div>
            {needEx.bulb}
          </div>
        </div>
        {needEx.panel}

        {view === 'scatter' && <CmpScatter rows={chartRows} lens="existing" />}
        {view === 'map' && <CmpMap rows={chartRows} lens="existing" />}
        {view === 'table' && <CmpTable rows={chartRows} />}
      </div>

      <div className="card" data-step="cmp-read">
        <ExplainTitle id="cmp-how-to-read">How to read it</ExplainTitle>
        <ul className="src-list" style={{ paddingLeft: 18 }}>
          <li><strong>Current demand against need:</strong> the gap between what today's SNCUs should have and what newborns actually need shows how much more the public system would have to add.</li>
          <li><strong>Two estimates of need:</strong> the RDS-based and facility-based numbers are worked out in different ways, so treat the range between them as the likely range rather than one exact figure. Use the “Need based on” buttons to choose which one the chart, map and table use.</li>
          <li><strong>Machines installed:</strong> only a few states report this, so use it to check the current-demand estimate, not as a national total.</li>
          <li>Private-sector demand is left out here on purpose. It is estimated separately on the CPAP Demand Estimation (Private) tab.</li>
        </ul>
      </div>
    </>
  )
}
