/** Forecasting tab: the factors that will drive the 5-year CPAP forecast, and the three
 *  scenarios we will model from them. The numeric year-on-year projection is still being built. */
export default function ForecastWIP() {
  const scenarios: { name: string; tag: string; note: string }[] = [
    {
      name: 'Scenario 1', tag: 'Baseline',
      note: 'The system carries on as it is. SNCUs and NICUs keep growing at the current rate. There are no policy or guideline changes, and no CPAPs are added in transport or at lower-level facilities.',
    },
    {
      name: 'Scenario 2', tag: 'Moderate expansion',
      note: 'Infrastructure grows a little faster than today, there is some policy or guideline change, and the busiest (high-load) NBSUs are equipped with CPAP.',
    },
    {
      name: 'Scenario 3', tag: 'Accelerated',
      note: 'Infrastructure grows faster still, with broader policy change — including new mother–newborn care units (MNCUs) that also carry CPAP. Staffing and training are strengthened.',
    },
  ]

  const matrix: { factor: string; s1: string; s2: string; s3: string }[] = [
    { factor: 'Growth in SNCUs / NICUs', s1: 'Same as now', s2: 'A little higher', s3: 'Higher' },
    { factor: 'Policy / guideline change', s1: 'None', s2: 'Some', s3: 'Broad' },
    { factor: 'CPAP at new facility levels', s1: 'None', s2: 'High-load NBSUs', s3: 'NBSUs + new MNCUs' },
    { factor: 'Staffing & training', s1: 'As now', s2: 'As now', s3: 'Strengthened' },
  ]

  return (
    <div>
      <div className="card lens-explainer" style={{ borderTop: '3px solid var(--c-accent)' }}>
        <div className="flex-between">
          <h2 style={{ marginBottom: 0 }}>CPAP Demand Forecasting</h2>
          <span className="badge entered">In development</span>
        </div>
        <p className="card-note" style={{ marginTop: 8 }}>
          This will project how many CPAP devices India needs over the <strong>next five years</strong>, year by year.
          The projection depends on the factors below. We group them into two kinds — what changes how many devices are
          <strong> available</strong> in the system, and what changes how much they are <strong>used</strong> — and we
          model <strong>three scenarios</strong> from different mixes of these factors. The numeric year-on-year lines
          are still being built.
        </p>
      </div>

      <div className="card">
        <h2>What affects the forecast</h2>
        <div className="wip-grid">
          <div className="wip-factor">
            <div className="wip-factor-title">Availability — how many devices are in the system</div>
            <ul className="src-list" style={{ paddingLeft: 18, marginTop: 8 }}>
              <li>Annual growth in the number of SNCUs (and NICUs).</li>
              <li>
                Policy or clinical guideline changes, such as:
                <ul className="src-list" style={{ paddingLeft: 18, marginTop: 4 }}>
                  <li>CPAPs placed at NBSUs — moving some newborn care to a lower level of facility.</li>
                  <li>Portable CPAPs added to the system — for use in ambulances and at facilities.</li>
                </ul>
              </li>
              <li>CPAP pricing.</li>
              <li>Training and capacity-building.</li>
            </ul>
          </div>
          <div className="wip-factor">
            <div className="wip-factor-title">Utilisation — how much the available devices are used</div>
            <ul className="src-list" style={{ paddingLeft: 18, marginTop: 8 }}>
              <li>Training and capacity-building.</li>
              <li>Availability of consumables.</li>
            </ul>
            <p className="card-note" style={{ margin: '10px 0 0', fontSize: '0.78rem' }}>
              Training and capacity-building appears in both groups because it raises both the number of facilities that
              can offer CPAP and how fully the machines already in place are used.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Three scenarios we will model</h2>
        <p className="card-note" style={{ marginTop: 0 }}>
          Each scenario is a different mix of the factors above, from a steady baseline to a faster build-out with policy
          change. Each will give its own five-year line for the number of CPAP devices needed.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
          {scenarios.map((s) => (
            <div key={s.name} className="wip-factor">
              <div className="wip-factor-title">{s.name} · {s.tag}</div>
              <div className="wip-factor-note" style={{ marginTop: 4 }}>{s.note}</div>
            </div>
          ))}
        </div>

        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Factor</th>
                <th style={{ textAlign: 'left' }}>Scenario 1 · Baseline</th>
                <th style={{ textAlign: 'left' }}>Scenario 2 · Moderate</th>
                <th style={{ textAlign: 'left' }}>Scenario 3 · Accelerated</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((r) => (
                <tr key={r.factor}>
                  <td>{r.factor}</td>
                  <td style={{ textAlign: 'left' }}>{r.s1}</td>
                  <td style={{ textAlign: 'left' }}>{r.s2}</td>
                  <td style={{ textAlign: 'left', fontWeight: 600, color: 'var(--c-primary-dark)' }}>{r.s3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
