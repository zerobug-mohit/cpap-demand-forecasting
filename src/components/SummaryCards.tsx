import type { Lens, Totals } from '../engine/method1'
import { fmt, fmtPct } from '../utils/format'

interface Props {
  totals: Totals
  lens: Lens
}

export default function SummaryCards({ totals, lens }: Props) {
  const primaryCpap = lens === 'asis' ? totals.asisCpap : totals.normCpap
  const primaryBeds = lens === 'asis' ? totals.asisBeds : totals.normBeds
  const lensLabel = lens === 'asis' ? 'guidelines-based' : 'full build-out'

  return (
    <div className="kpi-row">
      <div className={`kpi ${lens === 'asis' ? 'accent-teal' : 'accent-navy'}`}>
        <div className="kpi-label">CPAP required · {lens === 'asis' ? 'guidelines-based' : 'normative'}</div>
        <div className="kpi-value">{fmt(primaryCpap)}</div>
        <div className="kpi-sub">devices, {lensLabel}</div>
      </div>
      <div className="kpi accent-teal">
        <div className="kpi-label">SNCU beds</div>
        <div className="kpi-value">{fmt(primaryBeds)}</div>
        <div className="kpi-sub">{lens === 'asis' ? `${fmt(totals.sncu)} SNCUs × avg beds` : 'births ÷ 1,000 × norm'}</div>
      </div>
      <div className="kpi accent-good">
        <div className="kpi-label">Network coverage</div>
        <div className="kpi-value">{fmtPct(totals.coverage)}</div>
        <div className="kpi-sub">guidelines-based ÷ normative</div>
      </div>
      <div className="kpi accent-bad">
        <div className="kpi-label">Build-out gap</div>
        <div className="kpi-value">{fmt(totals.cpapGap)}</div>
        <div className="kpi-sub">normative − guidelines-based</div>
      </div>
    </div>
  )
}
