import type { Lens, Norms, Totals } from '../engine/method1'
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

export default function M1Flow({ norms, totals, lens }: { norms: Norms; totals: Totals; lens: Lens }) {
  const cpapNorm = norms.cpapPerBed.toFixed(2)
  const addon = norms.scope !== 'sncu' && totals.extraCpap > 0
  const addonNote = addon && (
    <div className="flow-side">includes NBSU / Transport add-on: {fmt(totals.extraCpap)} devices</div>
  )

  if (lens === 'asis') {
    return (
      <div className="flow">
        <Node tone="grey" title="SNCUs (units)" val={fmt(totals.sncu)} sub="operational SNCUs incl. NICUs (Oct 2024)" />
        <Op>× avg beds per SNCU <FactorPill target="m1-avgSncuBeds">{norms.avgSncuBeds}</FactorPill></Op>
        <Node tone="grey" title="SNCU beds (today's network)" val={fmt(totals.asisBeds)} />
        <Op>× CPAP-per-bed norm <FactorPill target="m1-cpapPerBed">{cpapNorm}</FactorPill></Op>
        <Node tone="out" title="CPAP required — guidelines-based" val={fmt(totals.asisCpap)} sub="summed to national total" />
        {addonNote}
      </div>
    )
  }

  const effIDR = totals.births > 0 ? totals.instBirths / totals.births : 0
  const effPub = totals.instBirths > 0 ? totals.pubInstBirths / totals.instBirths : 0
  const pct = (x: number) => `${Math.round(x * 100)}%`

  return (
    <div className="flow">
      <Node tone="grey" title="Live births" val={fmt(totals.births)} sub="population × SRS crude birth rate" />
      <Op>× institutional-delivery rate (~{pct(effIDR)}, NFHS-6)</Op>
      <Node tone="grey" title="Institutional births" val={fmt(totals.instBirths)} sub="live births × institutional-delivery rate" />
      {norms.publicOnly && (
        <>
          <Op>× public-facility share <FactorPill target="m1-publicShare">~{pct(effPub)}</FactorPill> (NFHS-6)</Op>
          <Node tone="grey" title="Public institutional births" val={fmt(totals.pubInstBirths)} sub="public (NHM) facilities only" />
        </>
      )}
      <Op>÷ 1,000 × normative beds / 1,000 <FactorPill target="m1-normBedsPer1000">{norms.normBedsPer1000}</FactorPill></Op>
      <Node tone="teal" title="Normative SNCU beds" val={fmt(totals.normBeds)} sub="fully built-out network" />
      <Op>× CPAP-per-bed norm <FactorPill target="m1-cpapPerBed">{cpapNorm}</FactorPill></Op>
      <Node tone="out" title="CPAP required — normative" val={fmt(totals.normCpap)} sub="summed to national total" />
      {addonNote}
    </div>
  )
}
