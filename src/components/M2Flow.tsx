import { useState } from 'react'
import type { Computed2, M2Norms, Totals2 } from '../engine/method2'
import { fmt } from '../utils/format'
import FactorPill from './FactorPill'
import { ExplainHere } from './Explain'

type Tone = 'grey' | 'teal' | 'out'

function Node({ tone, title, val, sub }: { tone: Tone; title: string; val: string; sub?: string }) {
  return (
    <div className={`flow-node ${tone}`}>
      {title}
      <span className="flow-val">{val}</span>
      {sub && <small>{sub}</small>}
    </div>
  )
}

const Op = ({ children }: { children: React.ReactNode }) => (
  <div className="flow-op">{children}<span className="op-arrow">↓</span></div>
)

export default function M2Flow({ norms, totals, rows }: { norms: M2Norms; totals: Totals2; rows: Computed2[] }) {
  const [geo, setGeo] = useState('National')
  const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`

  const sortedStates = [...rows].map((r) => r.state).sort((a, b) => a.localeCompare(b))
  const sel = geo === 'National' ? null : rows.find((r) => r.state === geo) ?? null

  // values for the selected geography (state row, or national totals)
  const births = sel ? sel.births : totals.births
  const instBirths = sel ? sel.instBirths : totals.instBirths
  const baseInst = sel ? sel.baseInstBirths : totals.baseInstBirths
  const eligible = sel ? sel.eligible : totals.eligible
  const reaching = sel ? sel.reaching : totals.reaching
  const meanC = sel ? sel.meanConcurrent : totals.meanConcurrent
  const gross = sel ? sel.gross : totals.gross
  const idrShown = sel ? sel.idr : (totals.births > 0 ? totals.instBirths / totals.births : 0)
  const pubShown = sel ? sel.publicShare : (totals.instBirths > 0 ? totals.baseInstBirths / totals.instBirths : 0)
  const eNat = (norms.rdsPer1000 / 1000) * norms.correction

  return (
    <div>
      <ExplainHere id="td-rds-flow" />
      <div className="flow-view-head" style={{ gap: 12, alignItems: 'center' }}>
        <label className="ctrl-inline">
          <span className="muted">Geography</span>
          <select value={geo} onChange={(e) => setGeo(e.target.value)}>
            <option value="National">India (national)</option>
            {sortedStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div className="flow">
        <Node tone="grey" title="Live births" val={fmt(births)} sub={sel ? `${sel.state} · SRS × population projections` : 'population × SRS birth rate'} />
        <Op>× share of births that happen in a facility (about {pct(idrShown)}, NFHS)</Op>
        <Node tone="grey" title="Births in facilities" val={fmt(instBirths)} />
        {(norms.publicOnly || norms.sector === 'private') && (
          <>
            <Op>× share in {norms.sector === 'private' ? 'private' : 'public'} facilities, about <FactorPill target="m2-publicShare">{pct(pubShown)}</FactorPill> (NFHS-6)</Op>
            <Node tone="grey" title={`Births in ${norms.sector === 'private' ? 'private' : 'public'} facilities`} val={fmt(baseInst)} sub={norms.sector === 'private' ? 'private facilities only' : 'public (government) facilities only'} />
          </>
        )}

        {sel ? (
          <>
            <Op>× {sel.state}'s share of the national total, based on its need (<FactorPill target="m2-driver">{pct(sel.share, 1)}</FactorPill>)</Op>
            <Node tone="teal" title="Newborns likely to need CPAP" val={fmt(eligible)} sub={`${sel.state}'s share`} />
          </>
        ) : (
          <>
            <Op>× share likely to need CPAP {pct(eNat, 1)} (RDS <FactorPill target="m2-rdsPer1000">{pct(norms.rdsPer1000 / 1000, 1)}</FactorPill> × <FactorPill target="m2-correction">{norms.correction.toFixed(1)}×</FactorPill> correction)</Op>
            <Node tone="teal" title="Newborns likely to need CPAP" val={fmt(eligible)} sub="national total" />
          </>
        )}

          <Op>× share of babies who reach a facility <FactorPill target="m2-admissionRate">{pct(norms.admissionRate)}</FactorPill></Op>
          <Node tone="teal" title="Babies reaching a facility" val={fmt(reaching)} />
          <Op>× days on CPAP <FactorPill target="m2-durationDays">{norms.durationDays} d</FactorPill> ÷ 365</Op>
          <Node tone="grey" title="Machines in use at once (average)" val={fmt(meanC)} />
          <div className="flow-side">
            Why divide by 365: each baby uses a machine for about {norms.durationDays} days (the number set on the left),
            so one machine can serve about {Math.round(365 / norms.durationDays)} babies over a year. Dividing the year's
            total by 365 gives the average number of machines in use at the same time.
          </div>
          <Op>+ planning buffer <FactorPill target="m2-buffer">{pct(norms.buffer)}</FactorPill> (for busy periods, wear and tear, and the time to reorder)</Op>
          <Node tone="out" title="CPAP devices needed" val={fmt(gross)} sub={sel ? `${sel.state} total` : 'added up across all states'} />
      </div>
    </div>
  )
}
