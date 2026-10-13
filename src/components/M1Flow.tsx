import type { Norms, Totals } from '../engine/method1'
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

export default function M1Flow({ norms, totals }: { norms: Norms; totals: Totals }) {
  const cpapNorm = norms.cpapPerBed.toFixed(2)
  const addon = norms.scope !== 'sncu' && totals.extraCpap > 0
  const normSubtotal = totals.asisSncuCpap + totals.extraCpap
  const addonNote = addon && (
    <div className="flow-side">This includes {fmt(totals.extraCpap)} devices from the NBSU and transport add-on.</div>
  )

  return (
    <div className="flow">
      <Node tone="grey" title="SNCUs (units)" val={fmt(totals.sncu)} sub="This count of SNCUs in operation in Oct 2024 includes NICUs." />
      <Op>× average beds per SNCU <FactorPill target="m1-avgSncuBeds">{norms.avgSncuBeds}</FactorPill></Op>
      <Node tone="grey" title="SNCU beds today" val={fmt(totals.asisBeds)} />
      <Op>× CPAP devices per bed <FactorPill target="m1-cpapPerBed">{cpapNorm}</FactorPill></Op>
      <Node tone="teal" title="CPAP under the FBNC norm" val={fmt(normSubtotal)} sub="This is before the planning buffer." />
      {addonNote}
      <Op>+ {Math.round(norms.buffer * 100)}% planning buffer <FactorPill target="m1-buffer">{Math.round(norms.buffer * 100)}%</FactorPill></Op>
      <Node tone="out" title="CPAP devices needed" val={fmt(totals.asisCpap)} sub="This is the norm subtotal plus the planning buffer." />
    </div>
  )
}
