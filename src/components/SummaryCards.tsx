import type { Totals } from '../engine/method1'
import { fmt } from '../utils/format'

interface Props {
  totals: Totals
}

export default function SummaryCards({ totals }: Props) {
  const perSncu = totals.sncu > 0 ? totals.asisCpap / totals.sncu : 0

  return (
    <div className="kpi-row">
      <div className="kpi accent-teal">
        <div className="kpi-label">CPAP devices needed</div>
        <div className="kpi-value">{fmt(totals.asisCpap)}</div>
        <div className="kpi-sub">today's SNCUs, per FBNC, plus the planning buffer</div>
      </div>
      <div className="kpi accent-navy">
        <div className="kpi-label">SNCU beds</div>
        <div className="kpi-value">{fmt(totals.asisBeds)}</div>
        <div className="kpi-sub">number of SNCUs × average beds each</div>
      </div>
      <div className="kpi accent-navy">
        <div className="kpi-label">SNCUs (units)</div>
        <div className="kpi-value">{fmt(totals.sncu)}</div>
        <div className="kpi-sub">in operation, including NICUs (Oct 2024)</div>
      </div>
      <div className="kpi accent-good">
        <div className="kpi-label">Average CPAP per SNCU</div>
        <div className="kpi-value">{perSncu.toFixed(1)}</div>
        <div className="kpi-sub">devices per SNCU, including the buffer</div>
      </div>
    </div>
  )
}
