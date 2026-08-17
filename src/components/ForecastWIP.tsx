/** Temporary placeholder for the Forecasting tab while the methodology is finalised. */
export default function ForecastWIP() {
  const drivers: { label: string; note: string }[] = [
    { label: 'SNCU network growth', note: 'fitted ~6.6%/yr from the published 2014–2024 SNCU series (log-linear).' },
    { label: 'Live births', note: 'NCP 2011–2036 population projections × SRS crude birth rate (declining ~1.3%/yr).' },
    { label: 'Institutional-delivery rate', note: 'trended from NFHS-5 → NFHS-6, capped at 100%.' },
    { label: 'Public-facility share', note: 'NFHS public share of institutional births (currently drifting ~1 pt/yr toward private).' },
    { label: 'RDS prevalence', note: 'held flat by default — only sparse Indian time points exist to trend it.' },
  ]

  const factors: { label: string; note: string }[] = [
    { label: 'Device attrition & replacement', note: 'CPAP units retire on a ~5–7-year cycle; replacement demand compounds new build-out.' },
    { label: 'Referral-network maturation', note: 'as NBSUs/transport strengthen, more sick newborns reach a CPAP-capable facility (admission rate rises).' },
    { label: 'Public ↔ private shift', note: 'the public share of institutional births is moving; NHM procurement need tracks that split, not just total births.' },
    { label: 'Protocol & technology change', note: 'wider early-CPAP adoption, HFNC/bubble-CPAP mix, and surfactant practice change the per-case device load.' },
    { label: 'Policy targets & budget cycles', note: 'FBNC/IPHS norm revisions and procurement rounds create step-changes, not smooth growth.' },
    { label: 'Utilisation & course duration', note: 'occupancy, weaning practice and length-of-stay shift how many devices a given caseload ties up.' },
    { label: 'Case-mix & prematurity trend', note: 'changing LBW/preterm burden and maternal health shift the eligible pool over time.' },
  ]

  return (
    <div>
      <div className="card lens-explainer" style={{ borderTop: '3px solid var(--c-accent)' }}>
        <div className="flex-between">
          <h2 style={{ marginBottom: 0 }}>CPAP Demand Forecasting</h2>
          <span className="badge entered">Work in progress</span>
        </div>
        <p className="card-note" style={{ marginTop: 8 }}>
          This module is being finalised and validated before release. The estimation tabs
          (<strong>Guidelines-based</strong> and <strong>Epidemiological</strong>) give today's snapshot; forecasting
          will carry that snapshot forward and show how the requirement — and the gap to it — <strong>spreads over the
          next 5–7 years</strong>, so procurement can be phased rather than one-off.
        </p>
      </div>

      <div className="card">
        <h2>How the forecast will work</h2>
        <p className="card-note" style={{ marginTop: 0 }}>
          Each trajectory (current infra-based / epidemiological / normative) grows from today's estimate by its own
          driver, most of which are already sourced and wired in:
        </p>
        <ul className="src-list" style={{ paddingLeft: 18 }}>
          {drivers.map((d) => (
            <li key={d.label}><strong>{d.label}:</strong> {d.note}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Other factors shaping demand over time</h2>
        <p className="card-note" style={{ marginTop: 0 }}>
          A credible forecast is more than scaling births. We are working through the levers below — each changes
          <em> how demand spreads year to year</em>, and several create step-changes rather than smooth curves:
        </p>
        <div className="wip-grid">
          {factors.map((f) => (
            <div key={f.label} className="wip-factor">
              <div className="wip-factor-title">{f.label}</div>
              <div className="wip-factor-note">{f.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="callout">
          <strong>Why it's masked for now.</strong> Trending several of these factors on thin Indian time-series data
          risks a confident-looking but unreliable line. We would rather ship the forecast once each driver is
          evidence-backed and the assumptions are transparent — the same standard as the estimation tabs.
          For inputs, data, or to follow progress, reach out to <a href="mailto:mchaurasiya@wjcf.in">mchaurasiya@wjcf.in</a>.
        </div>
      </div>
    </div>
  )
}
