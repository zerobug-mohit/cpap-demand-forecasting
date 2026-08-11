import type { Totals } from '../engine/method1'
import { fmt, fmtPct } from '../utils/format'

export default function InsightCard({ totals }: { totals: Totals }) {
  return (
    <div className="card">
      <h2>Reading the estimate</h2>
      <div className="recommend">
        Under FBNC 2025 norms, India's <strong>current</strong> SNCU network implies about{' '}
        <strong>{fmt(totals.asisCpap)} CPAP devices</strong>, while a <strong>fully built-out</strong> network
        implies about <strong>{fmt(totals.normCpap)}</strong>. The current network therefore sits at roughly{' '}
        <strong>{fmtPct(totals.coverage)}</strong> of the normative ceiling — a build-out gap of about{' '}
        <strong>{fmt(totals.cpapGap)} devices</strong>.
      </div>
      {totals.extraCpap > 0 && (
        <p style={{ fontSize: '0.85rem', marginTop: 12, marginBottom: 0 }}>
          The selected scope adds <strong>{fmt(totals.extraCpap)}</strong> CPAP devices
          ({fmt(totals.nbsuCpap)} NBSU{totals.transportCpap > 0 ? ` + ${fmt(totals.transportCpap)} transport` : ''}) to
          each lens — beyond current FBNC guidance.
        </p>
      )}
      <div className="callout" style={{ marginTop: 14 }}>
        <strong>Read with care.</strong> Per-state SNCU beds are unpublished, so beds are derived from unit counts ×
        average beds — the single biggest lever (try the slider). The normative lens is a ceiling (the norm is
        applied to all births). Installed CPAP counts are not public, so the actual procurement gap needs a facility
        device survey (Madhya Pradesh first).
      </div>
    </div>
  )
}
