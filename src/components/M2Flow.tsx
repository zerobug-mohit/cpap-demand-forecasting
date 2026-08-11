import { useState } from 'react'
import type { Computed2, M2Norms, Totals2 } from '../engine/method2'
import { fmt } from '../utils/format'
import FactorPill from './FactorPill'

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
  const [view, setView] = useState<'national' | 'state'>('national')
  const effIDR = totals.births > 0 ? totals.instBirths / totals.births : 0
  const eNat = (norms.rdsPer1000 / 1000) * norms.correction
  const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`

  const top = [...rows].sort((a, b) => b.gross - a.gross).slice(0, 3)
  const rest = rows.length - top.length
  const restGross = totals.gross - top.reduce((s, r) => s + r.gross, 0)

  return (
    <div>
      <div className="flow-view-head">
        <div className="seg-toggle" role="group" aria-label="Flow view">
          <button className={view === 'national' ? 'active' : ''} onClick={() => setView('national')}>National pool</button>
          <button className={view === 'state' ? 'active' : ''} onClick={() => setView('state')}>State split</button>
        </div>
      </div>
      <div className="flow">
        <Node tone="grey" title="Live births" val={fmt(totals.births)} sub="population × SRS crude birth rate" />
        <Op>× institutional-delivery rate (~{pct(effIDR)}, NFHS)</Op>
        <Node tone="grey" title="Institutional births" val={fmt(totals.instBirths)} />
        <Op>× eligibility {pct(eNat, 1)} = RDS <FactorPill target="m2-rdsPer1000">{pct(norms.rdsPer1000 / 1000, 1)}</FactorPill> × <FactorPill target="m2-correction">{norms.correction.toFixed(1)}×</FactorPill> · national anchor</Op>
        <Node tone="teal" title="CPAP-eligible cases" val={fmt(totals.eligible)} sub={view === 'state' ? 'national pool, then redistributed to states' : 'national clinical-need pool'} />

        {view === 'national' ? (
          <>
            <Op>× facility admission rate <FactorPill target="m2-admissionRate">{pct(norms.admissionRate)}</FactorPill></Op>
            <Node tone="teal" title="Cases reaching facility" val={fmt(totals.reaching)} />
            <Op>× CPAP duration <FactorPill target="m2-durationDays">{norms.durationDays} d</FactorPill> ÷ 365</Op>
            <Node tone="grey" title="Mean concurrent devices" val={fmt(totals.meanConcurrent)} />
            <div className="flow-side">
              Why ÷ 365: this assumes each case is administered CPAP for ~{norms.durationDays} days (the RDS-course duration
              set on the left), so a course ties up a device for that long. Annual courses × days ÷ 365 = the average number
              of devices in use at the same time (one device covers ~{Math.round(365 / norms.durationDays)} courses a year).
            </div>
            <Op>+ planning buffer <FactorPill target="m2-buffer">{pct(norms.buffer)}</FactorPill> (peak concurrency, attrition, lead-time)</Op>
            <Node tone="out" title="Gross device requirement" val={fmt(totals.gross)} sub="summed to national total" />
          </>
        ) : (
          <>
            <div className="flow-side">
              State split ∝ institutional births × <FactorPill target="m2-driver">risk-index</FactorPill><sup>
              <FactorPill target="m2-beta">β {norms.beta.toFixed(2)}</FactorPill></sup> · index = LBW % + NMR (state ÷ national)
            </div>
            <Op>
              each state's share → same cascade (× admission <FactorPill target="m2-admissionRate">{pct(norms.admissionRate)}</FactorPill>
              {' '}· × duration <FactorPill target="m2-durationDays">{norms.durationDays} d</FactorPill> ÷ 365
              {' '}· + buffer <FactorPill target="m2-buffer">{pct(norms.buffer)}</FactorPill>)
            </Op>
            <div className="flow-split-row">
              {top.map((r, i) => (
                <Node key={r.state} tone="teal" title={`${i + 1}. ${r.state}`} val={fmt(r.gross)}
                  sub={`${pct(r.share, 1)} of pool · ${fmt(r.eligible)} eligible`} />
              ))}
            </div>
            <div className="flow-side" style={{ textAlign: 'center' }}>
              … similarly for the other <strong>{rest}</strong> states/UTs (≈ {fmt(restGross)} devices).
            </div>
            <span className="op-arrow" style={{ display: 'block', textAlign: 'center' }}>↓</span>
            <Node tone="out" title="Gross device requirement" val={fmt(totals.gross)} sub="all 36 states/UTs summed to national total" />
          </>
        )}
      </div>
    </div>
  )
}
