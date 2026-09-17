import type { Totals } from '../engine/method1'
import { fmt } from '../utils/format'

export default function InsightCard({ totals }: { totals: Totals }) {
  return (
    <div className="card">
      <h2>Reading the estimate</h2>
      <div className="recommend">
        Under FBNC 2025 norms, India's <strong>current</strong> SNCU network (incl. NICUs) implies about{' '}
        <strong>{fmt(totals.asisCpap)} CPAP devices</strong> — the CPAP the network that exists today should be equipped
        with per guidelines, across <strong>{fmt(totals.sncu)}</strong> SNCUs and <strong>{fmt(totals.asisBeds)}</strong> beds.
      </div>
      {totals.extraCpap > 0 && (
        <p style={{ fontSize: '0.85rem', marginTop: 12, marginBottom: 0 }}>
          The selected scope adds <strong>{fmt(totals.extraCpap)}</strong> CPAP devices
          ({fmt(totals.nbsuCpap)} NBSU{totals.transportCpap > 0 ? ` + ${fmt(totals.transportCpap)} transport` : ''}) —
          beyond current FBNC guidance.
        </p>
      )}
      <div className="callout" style={{ marginTop: 14 }}>
        <strong>Read with care.</strong> Per-state SNCU beds are unpublished, so beds are derived from unit counts ×
        average beds — the single biggest lever (try the slider). This is a guidelines-based reading of the{' '}
        <em>existing</em> network; how much CPAP the population actually <em>needs</em> — including where no SNCU exists
        yet — is estimated on the <strong>Epidemiological</strong> tab. Installed CPAP counts are not public, so the
        actual procurement gap needs a facility device survey (Madhya Pradesh first).
      </div>
    </div>
  )
}
