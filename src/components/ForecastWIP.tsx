/** Temporary placeholder for the Forecasting tab while the methodology is finalised. */
export default function ForecastWIP() {
  const drivers: { label: string; note: string }[] = [
    { label: 'Growth in SNCUs', note: 'the number of SNCUs has grown about 6.6% a year, based on the published 2014–2024 figures.' },
    { label: 'Number of births', note: 'from the official population projections and birth rate. It is slowly falling, by about 1.3% a year.' },
    { label: 'Share of births in facilities', note: 'the share of births that happen in a health facility, trended from NFHS-5 to NFHS-6 and capped at 100%.' },
    { label: 'Public vs private share', note: 'the share of facility births that happen in public (government) facilities, which is slowly shifting toward private.' },
    { label: 'How common breathing problems are', note: 'kept steady for now, because there are very few Indian data points to show a trend.' },
  ]

  const factors: { label: string; note: string }[] = [
    { label: 'Machines wearing out', note: 'CPAP machines last about 5–7 years and then need replacing, which adds to the demand for new ones.' },
    { label: 'Better referral and transport', note: 'as newborn-care units and transport improve, more sick babies reach a facility that has CPAP, so demand rises.' },
    { label: 'Shift between public and private', note: 'the public share of facility births is changing, and government demand follows that share, not just the total number of births.' },
    { label: 'Changes in treatment and technology', note: 'wider use of early CPAP, and changes in the mix of machines and treatments, change how many machines each case needs.' },
    { label: 'Policy targets and budget cycles', note: 'changes to government norms and buying rounds cause sudden jumps rather than smooth growth.' },
    { label: 'How machines are used', note: 'how busy units are and how long babies stay on CPAP change how many machines a given caseload ties up.' },
    { label: 'Changes in the babies being born', note: 'changes in low birth weight, premature birth and maternal health change how many babies need CPAP over time.' },
  ]

  return (
    <div>
      <div className="card lens-explainer" style={{ borderTop: '3px solid var(--c-accent)' }}>
        <div className="flex-between">
          <h2 style={{ marginBottom: 0 }}>CPAP Demand Forecasting</h2>
          <span className="badge entered">Work in progress</span>
        </div>
        <p className="card-note" style={{ marginTop: 8 }}>
          This part of the tool is still being built and checked before release. The estimation tabs
          (<strong>Guidelines-based current demand</strong> and <strong>Epidemiological need</strong>) show the demand
          today. The forecast will take that starting point and show how the demand — and the gap between demand and what
          exists — is likely to change over the <strong>next 5 to 7 years</strong>, so machines can be bought in phases
          instead of all at once.
        </p>
      </div>

      <div className="card">
        <h2>How the forecast will work</h2>
        <p className="card-note" style={{ marginTop: 0 }}>
          Each line grows from today's estimate using its own drivers. Most of these are already sourced and built in:
        </p>
        <ul className="src-list" style={{ paddingLeft: 18 }}>
          {drivers.map((d) => (
            <li key={d.label}><strong>{d.label}:</strong> {d.note}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Other things that change demand over time</h2>
        <p className="card-note" style={{ marginTop: 0 }}>
          A good forecast is more than scaling up births. We are still working through the points below. Each one changes
          how demand grows from year to year, and several cause sudden jumps rather than smooth growth:
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
          <strong>Why it isn't shown yet.</strong> Projecting several of these factors on very little Indian data risks a
          line that looks confident but is not reliable. We would rather release the forecast once each driver is backed
          by evidence and the assumptions are clear — the same standard as the estimation tabs. For inputs, data, or to
          follow progress, please contact <a href="mailto:mchaurasiya@wjcf.in">mchaurasiya@wjcf.in</a>.
        </div>
      </div>
    </div>
  )
}
