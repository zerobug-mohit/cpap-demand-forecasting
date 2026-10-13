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
        <div className="kpi-sub">This is for today's SNCUs under the FBNC norm, plus the planning buffer.</div>
      </div>
      <div className="kpi accent-navy">
        <div className="kpi-label">SNCU beds</div>
        <div className="kpi-value">{fmt(totals.asisBeds)}</div>
        <div className="kpi-sub">This is the number of SNCUs times the average beds in each.</div>
      </div>
      <div className="kpi accent-navy">
        <div className="kpi-label">SNCUs (units)</div>
        <div className="kpi-value">{fmt(totals.sncu)}</div>
        <div className="kpi-sub">This count of SNCUs in operation in Oct 2024 includes NICUs.</div>
      </div>
      <div className="kpi accent-good">
        <div className="kpi-label">Average CPAP per SNCU</div>
        <div className="kpi-value">{perSncu.toFixed(1)}</div>
        <div className="kpi-sub">This includes the planning buffer.</div>
      </div>
    </div>
  )
}
