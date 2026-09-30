import type { Totals } from '../engine/method1'
import { fmt } from '../utils/format'

export default function InsightCard({ totals }: { totals: Totals }) {
  return (
    <div className="card">
      <h2>What this number means</h2>
      <div className="recommend">
        Using the FBNC 2025 guidelines, the SNCUs that exist today (including NICUs) should have about{' '}
        <strong>{fmt(totals.asisCpap)} CPAP devices</strong>. This is spread across <strong>{fmt(totals.sncu)}</strong>{' '}
        SNCUs and <strong>{fmt(totals.asisBeds)}</strong> beds, and includes a <strong>25% planning buffer</strong> for
        busy periods, machines wearing out, and the time needed to order replacements.
      </div>
      {totals.extraCpap > 0 && (
        <p style={{ fontSize: '0.85rem', marginTop: 12, marginBottom: 0 }}>
          The scope you selected adds <strong>{fmt(totals.extraCpap)}</strong> more devices
          ({fmt(totals.nbsuCpap)} from NBSUs{totals.transportCpap > 0 ? `, ${fmt(totals.transportCpap)} for transport` : ''}).
          These are beyond what the current FBNC guideline asks for.
        </p>
      )}
      <div className="callout" style={{ marginTop: 14 }}>
        <strong>Please read this carefully.</strong> The number of beds in each state's SNCUs is not published, so we
        estimate it by multiplying the number of SNCUs by an average number of beds each. This average is the biggest
        assumption in the estimate, and you can change it with the slider on the left. This number is based only on the
        facilities that exist today. To see how many devices newborns actually need, including in areas that have no SNCU
        yet, use the <strong>Epidemiological need</strong> tab. The number of devices actually installed is not public,
        so measuring the real shortfall would need a facility-by-facility survey (starting with Madhya Pradesh).
      </div>
    </div>
  )
}
