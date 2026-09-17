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
        <div className="kpi-label">CPAP required · current infra-based</div>
        <div className="kpi-value">{fmt(totals.asisCpap)}</div>
        <div className="kpi-sub">devices, today's SNCU network per FBNC</div>
      </div>
      <div className="kpi accent-navy">
        <div className="kpi-label">SNCU beds</div>
        <div className="kpi-value">{fmt(totals.asisBeds)}</div>
        <div className="kpi-sub">{fmt(totals.sncu)} SNCUs × avg beds</div>
      </div>
      <div className="kpi accent-navy">
        <div className="kpi-label">SNCUs (units)</div>
        <div className="kpi-value">{fmt(totals.sncu)}</div>
        <div className="kpi-sub">operational, incl. NICUs (Oct 2024)</div>
      </div>
      <div className="kpi accent-good">
        <div className="kpi-label">Avg CPAP / SNCU</div>
        <div className="kpi-value">{perSncu.toFixed(1)}</div>
        <div className="kpi-sub">implied by beds × CPAP-per-bed norm</div>
      </div>
    </div>
  )
}
