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
  const addonNote = addon && (
    <div className="flow-side">includes NBSU / Transport add-on: {fmt(totals.extraCpap)} devices</div>
  )

  return (
    <div className="flow">
      <Node tone="grey" title="SNCUs (units)" val={fmt(totals.sncu)} sub="operational SNCUs incl. NICUs (Oct 2024)" />
      <Op>× avg beds per SNCU <FactorPill target="m1-avgSncuBeds">{norms.avgSncuBeds}</FactorPill></Op>
      <Node tone="grey" title="SNCU beds (today's network)" val={fmt(totals.asisBeds)} />
      <Op>× CPAP-per-bed norm <FactorPill target="m1-cpapPerBed">{cpapNorm}</FactorPill></Op>
      <Node tone="out" title="CPAP required — current infra-based" val={fmt(totals.asisCpap)} sub="summed to national total" />
      {addonNote}
    </div>
  )
}
