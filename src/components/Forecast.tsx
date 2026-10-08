import { useMemo, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Norms } from '../engine/method1'
import { STATES } from '../data/states'
import { SCENARIOS, scenarioParams, computeForecast, DEFAULT_HORIZON } from '../engine/methodForecast'
import type { ForecastParams, ForecastBase } from '../engine/methodForecast'
import { fmt } from '../utils/format'
import FactorPill from './FactorPill'

const AxisTick = { fontSize: 11, fill: '#52616d', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }
const COMP = [
  { key: 'sncuCore', label: 'SNCU network', color: '#0e7e92' },
  { key: 'nbsu', label: 'CPAP at NBSUs', color: '#c2912a' },
  { key: 'mncu', label: 'New MNCUs', color: '#123a5e' },
  { key: 'portable', label: 'Portable / transport', color: '#2f8f6b' },
] as const

type Tone = 'grey' | 'teal' | 'out'
function Node({ tone, title, val, sub }: { tone: Tone; title: string; val: string; sub?: string }) {
  return (
    <div className={`flow-node ${tone}`}>
      {title}
      <span className="flow-val">{val}</span>
      {sub && <small>{sub}</small>}
    </div>
  )
}
const Op = ({ children }: { children: React.ReactNode }) => (
  <div className="flow-op">{children}<span className="op-arrow">↓</span></div>
)

function Range({ id, label, value, min, max, step, suffix, onChange }: {
  id?: string; label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v: number) => void
}) {
  return (
    <div className="field" id={id} style={{ marginBottom: 12 }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.84rem', fontWeight: 600, marginBottom: 5 }}>
        <span>{label}</span>
        <span className="fc-normv">{value}{suffix}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} style={{ width: '100%', accentColor: 'var(--c-primary)' }}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  )
}

function Num({ id, label, value, min, max, step, onChange }: {
  id?: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div id={id}>
      <div className="fc-mini">{label}</div>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(Math.max(min, Math.min(max, e.target.value === '' ? min : parseFloat(e.target.value) || 0)))} />
    </div>
  )
}

export default function Forecast({ m1 }: { m1: Norms }) {
  const base: ForecastBase = useMemo(() => ({
    sncu: STATES.reduce((a, s) => a + s.sncu, 0),
    nbsu: STATES.reduce((a, s) => a + s.nbsu, 0),
    cpapPerSncu: m1.avgSncuBeds * m1.cpapPerBed * (1 + m1.buffer),
  }), [m1])

  const [horizon, setHorizon] = useState(DEFAULT_HORIZON)
  const [params, setParams] = useState<Record<string, ForecastParams>>(
    () => Object.fromEntries(SCENARIOS.map((s) => [s.key, { ...s.params }])),
  )
  const [sel, setSel] = useState('s1')

  const results = useMemo(
    () => SCENARIOS.map((s) => ({ ...s, years: computeForecast(base, { ...params[s.key], horizon }) })),
    [base, params, horizon],
  )
  const selScn = results.find((r) => r.key === sel)!
  const selYears = selScn.years
  const p = params[sel]
  const setP = (patch: Partial<ForecastParams>) => setParams((prev) => ({ ...prev, [sel]: { ...prev[sel], ...patch } }))
  const resetSel = () => setParams((prev) => ({ ...prev, [sel]: scenarioParams(sel) }))
  const dirty = JSON.stringify(p) !== JSON.stringify({ ...scenarioParams(sel), horizon: p.horizon })

  const baseYear = new Date().getFullYear()
  const endYear = baseYear + horizon
  const yr = (t: number) => baseYear + t

  const lineData = Array.from({ length: horizon + 1 }, (_, t) => {
    const row: Record<string, number> = { year: yr(t) }
    results.forEach((r) => { row[r.key] = Math.round(r.years[t].total) })
    return row
  })
  const breakdownData = selYears.map((y) => ({
    year: yr(y.year),
    sncuCore: Math.round(y.sncuCore), nbsu: Math.round(y.nbsu), mncu: Math.round(y.mncu), portable: Math.round(y.portable),
  }))

  const today = selYears[0]
  const end = selYears[horizon]
  const pctUp = today.total > 0 ? Math.round((end.total / today.total - 1) * 100) : 0

  const LineTip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div className="chart-tip">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {results.map((r) => (
        <div key={r.key} style={{ color: r.color }}>{r.tag}: <strong>{fmt(r.years[label - baseYear].total)}</strong></div>
      ))}
    </div>
  ) : null

  const BarTip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div className="chart-tip">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {[...COMP].reverse().filter((c) => (payload.find((pl: any) => pl.dataKey === c.key)?.value ?? 0) > 0).map((c) => (
        <div key={c.key} style={{ color: c.color }}>{c.label}: <strong>{fmt(payload.find((pl: any) => pl.dataKey === c.key).value)}</strong></div>
      ))}
      <div style={{ borderTop: '1px solid #e4ebef', marginTop: 4, paddingTop: 4 }}>Total: <strong>{fmt(COMP.reduce((a, c) => a + (payload.find((pl: any) => pl.dataKey === c.key)?.value ?? 0), 0))}</strong></div>
    </div>
  ) : null

  return (
    <div>
      {/* ---------------- scenario chooser (explained) ---------------- */}
      <div className="card">
        <h2>Choose a scenario</h2>
        <p className="card-note">
          A scenario is a set of assumptions about how the system will grow and what policy changes happen. We start
          from three — a steady baseline, a moderate expansion, and an accelerated build-out. Pick one to explore and
          fine-tune; all three stay on the chart so you can compare them. Everything here is an assumption you can change.
        </p>
        <div className="scn-cards">
          {results.map((r) => {
            const rp = params[r.key]
            return (
              <button key={r.key} className={`scn-card ${sel === r.key ? 'on' : ''}`} style={{ ['--scn' as string]: r.color }} onClick={() => setSel(r.key)}>
                <div className="scn-card-head"><span className="scn-dot" />{r.name} · {r.tag}</div>
                <p className="scn-card-desc">{r.blurb}</p>
                <div className="scn-card-rows">
                  <div><span>SNCU growth</span><b>{rp.sncuGrowthPct}% / yr</b></div>
                  <div><span>CPAP at NBSUs</span><b>{rp.nbsuCpapSharePct ? `${rp.nbsuCpapSharePct}%` : 'none'}</b></div>
                  <div><span>New MNCUs</span><b>{rp.mncuByEnd ? fmt(rp.mncuByEnd) : 'none'}</b></div>
                  <div><span>Portable / transport</span><b>{rp.portableSharePct ? `${rp.portableSharePct}%` : 'none'}</b></div>
                </div>
                <div className="scn-card-out">Devices needed by {endYear} <b>{fmt(r.years[horizon].total)}</b></div>
              </button>
            )
          })}
        </div>

        <div className="recommend" style={{ marginTop: 16 }}>
          Under <strong>{selScn.tag}</strong>, the number of CPAP devices required rises from{' '}
          <strong>{fmt(today.total)}</strong> today to <strong>{fmt(end.total)}</strong> by {endYear} — about{' '}
          <strong>{pctUp}% higher</strong>. Meeting that means procuring around <strong>{fmt(end.cumAdded)}</strong>{' '}
          devices over {horizon} years (the yearly growth plus replacements), costing roughly{' '}
          <strong>₹{fmt(Math.round(end.cumCostCr))} crore</strong> at today's unit price.
        </div>
      </div>

      <div className="layout-grid">
        {/* ---------------- factor controls ---------------- */}
        <div className="card card-tight sticky-col fc-panel">
          <div className="flex-between">
            <h2>Adjust {selScn.tag}</h2>
            <button className="btn link" onClick={resetSel} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4, background: 'none', border: 0, color: 'var(--c-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}>Reset</button>
          </div>
          <p className="card-note" style={{ marginTop: 2 }}>Change any factor and every chart, number and calculation below updates. You are editing the <strong>{selScn.tag}</strong> scenario.</p>

          <div className="section-label" style={{ marginTop: 8 }}>Horizon</div>
          <Range id="fc-horizon" label="Years to project" value={horizon} min={3} max={7} step={1} suffix=" yr" onChange={setHorizon} />

          <div className="section-label">Infrastructure growth</div>
          <p className="hint" style={{ marginTop: 0 }}>More SNCUs each year means more CPAP needed. The baseline 6.6% / yr comes from the published 2014–2024 SNCU counts.</p>
          <Range id="fc-growth" label="SNCU / NICU growth per year" value={p.sncuGrowthPct} min={0} max={20} step={0.5} suffix="%" onChange={(v) => setP({ sncuGrowthPct: v })} />

          <div className="section-label">Policy — new CPAP placements</div>
          <p className="hint" style={{ marginTop: 0 }}>Policy change puts CPAP at lower-level facilities and in transport. Each target below is reached gradually, from now to {endYear}.</p>
          <Range id="fc-nbsu" label={`NBSUs with CPAP by ${endYear}`} value={p.nbsuCpapSharePct} min={0} max={100} step={5} suffix="%" onChange={(v) => setP({ nbsuCpapSharePct: v })} />
          <Range id="fc-portable" label={`Portable / transport CPAP by ${endYear}`} value={p.portableSharePct} min={0} max={50} step={5} suffix="% of SNCUs" onChange={(v) => setP({ portableSharePct: v })} />
          <div className="fc-row2" style={{ marginBottom: 12 }}>
            <Num id="fc-mncu" label={`New MNCUs by ${endYear}`} value={p.mncuByEnd} min={0} max={1000} step={10} onChange={(v) => setP({ mncuByEnd: v })} />
            <Num id="fc-cpapMncu" label="CPAP / MNCU" value={p.cpapPerMncu} min={1} max={8} step={1} onChange={(v) => setP({ cpapPerMncu: v })} />
          </div>
          <div className="fc-row2" style={{ marginBottom: 12 }}>
            <Num id="fc-cpapNbsu" label="CPAP / NBSU" value={p.cpapPerNbsu} min={1} max={4} step={0.5} onChange={(v) => setP({ cpapPerNbsu: v })} />
            <Num id="fc-cpapPortable" label="CPAP / portable unit" value={p.cpapPerPortable} min={1} max={3} step={0.5} onChange={(v) => setP({ cpapPerPortable: v })} />
          </div>

          <div className="section-label">Utilisation &amp; procurement</div>
          <p className="hint" style={{ marginTop: 0 }}>How fully the devices are actually used, how often they wear out, and what they cost.</p>
          <Range id="fc-util" label="Utilisation (training + consumables)" value={p.utilisationPct} min={50} max={100} step={5} suffix="%" onChange={(v) => setP({ utilisationPct: v })} />
          <div className="fc-row2">
            <Num id="fc-life" label="Device lifespan (yrs)" value={p.replacementYears} min={3} max={12} step={1} onChange={(v) => setP({ replacementYears: v })} />
            <Num id="fc-price" label="Unit price (₹ lakh)" value={p.unitPriceLakh} min={0.5} max={5} step={0.1} onChange={(v) => setP({ unitPriceLakh: v })} />
          </div>

          <p className="source-note" style={{ marginTop: 14 }}>
            <span className="src-prefix">Base:</span> {fmt(base.sncu)} SNCUs and {fmt(base.nbsu)} NBSUs today (RHS 2022-23); {base.cpapPerSncu.toFixed(1)} CPAP per SNCU, carried from the guidelines inputs.
          </p>
        </div>

        {/* ---------------- results ---------------- */}
        <div>
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-label">Devices required · {endYear}</div>
              <div className="kpi-value">{fmt(end.total)}</div>
              <div className="kpi-sub">up from {fmt(today.total)} today ({pctUp}% higher)</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">New devices to procure</div>
              <div className="kpi-value">{fmt(end.cumAdded)}</div>
              <div className="kpi-sub">over {horizon} yrs, incl. replacements</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Procurement cost</div>
              <div className="kpi-value">₹{fmt(Math.round(end.cumCostCr))} Cr</div>
              <div className="kpi-sub">at ₹{p.unitPriceLakh.toFixed(1)} lakh per device</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">In service · {endYear}</div>
              <div className="kpi-value">{fmt(end.effective)}</div>
              <div className="kpi-sub">at {p.utilisationPct}% utilisation</div>
            </div>
          </div>

          <div className="card">
            <h2>Devices required by year — the three scenarios</h2>
            <p className="card-note">Each line is a scenario's total CPAP devices required, year by year. The one you are editing ({selScn.tag}) is drawn bold.</p>
            <div className="chart-box" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 20, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="#e4ebef" vertical={false} />
                  <XAxis dataKey="year" tick={AxisTick} />
                  <YAxis tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54} />
                  <Tooltip content={<LineTip />} />
                  {results.map((r) => (
                    <Line key={r.key} type="monotone" dataKey={r.key} name={r.tag} stroke={r.color}
                      strokeWidth={r.key === sel ? 3 : 1.6} strokeOpacity={r.key === sel ? 1 : 0.5}
                      dot={{ r: r.key === sel ? 3 : 0 }} activeDot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-row">
              {results.map((r) => (
                <span key={r.key} style={{ fontWeight: r.key === sel ? 700 : 400 }}>
                  <span className="legend-dot" style={{ background: r.color }} />{r.tag}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>What makes up {selScn.tag}'s total</h2>
            <p className="card-note">The total splits into four parts — the SNCU network (the bulk of it) plus the policy placements as they phase in. Hover a year to see each part.</p>
            <div className="chart-box" style={{ height: 290 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 8, right: 20, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="#e4ebef" vertical={false} />
                  <XAxis dataKey="year" tick={AxisTick} />
                  <YAxis tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54} />
                  <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(14,126,146,0.06)' }} />
                  {COMP.map((c) => (<Bar key={c.key} dataKey={c.key} name={c.label} stackId="a" fill={c.color} />))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-row">
              {COMP.map((c) => (<span key={c.key}><span className="legend-dot" style={{ background: c.color }} />{c.label}</span>))}
            </div>
          </div>

          <div className="card">
            <h2>Step by step — how {endYear}'s total is built</h2>
            <p className="card-note">
              Every yellow value is a factor you can change — click one to jump to its control. Each part of the
              requirement is worked out below, then added together.
            </p>

            <div className="section-label" style={{ marginTop: 6 }}>1 · The SNCU network (the core)</div>
            <p className="hint" style={{ marginTop: 0 }}>As the number of SNCUs grows, so does the CPAP they need. This is the largest part of the total.</p>
            <div className="flow">
              <Node tone="grey" title="SNCUs today" val={fmt(base.sncu)} sub={String(baseYear)} />
              <Op>grow <FactorPill target="fc-growth">{p.sncuGrowthPct}%</FactorPill> / yr for <FactorPill target="fc-horizon">{horizon} yr</FactorPill></Op>
              <Node tone="grey" title={`SNCUs in ${endYear}`} val={fmt(end.sncu)} />
              <Op>× {base.cpapPerSncu.toFixed(1)} CPAP per SNCU <span className="muted" style={{ fontSize: '0.72rem' }}>(from the guidelines inputs)</span></Op>
              <Node tone="teal" title="SNCU network devices" val={fmt(end.sncuCore)} />
            </div>

            <div className="section-label">2 · Policy placements (phased in by {endYear})</div>
            <p className="hint" style={{ marginTop: 0 }}>If policy changes, CPAP is added at lower-level facilities and in transport. These are zero in the baseline.</p>
            <div className="fc-addlist">
              <div><span className="fc-add-lab"><span className="comp-dot" style={{ background: '#c2912a' }} />CPAP at NBSUs</span>
                <span className="fc-add-calc">{fmt(base.nbsu)} NBSUs × <FactorPill target="fc-nbsu">{p.nbsuCpapSharePct}%</FactorPill> × <FactorPill target="fc-cpapNbsu">{p.cpapPerNbsu}</FactorPill> = <strong>{fmt(end.nbsu)}</strong></span></div>
              <div><span className="fc-add-lab"><span className="comp-dot" style={{ background: '#123a5e' }} />New MNCUs</span>
                <span className="fc-add-calc"><FactorPill target="fc-mncu">{fmt(p.mncuByEnd)}</FactorPill> × <FactorPill target="fc-cpapMncu">{p.cpapPerMncu}</FactorPill> = <strong>{fmt(end.mncu)}</strong></span></div>
              <div><span className="fc-add-lab"><span className="comp-dot" style={{ background: '#2f8f6b' }} />Portable / transport</span>
                <span className="fc-add-calc"><FactorPill target="fc-portable">{p.portableSharePct}%</FactorPill> of {fmt(end.sncu)} SNCUs × <FactorPill target="fc-cpapPortable">{p.cpapPerPortable}</FactorPill> = <strong>{fmt(end.portable)}</strong></span></div>
            </div>

            <div className="fc-grand" style={{ marginTop: 14 }}>
              <span className="g-lab">Total devices required · {endYear}</span>
              <span className="g-val fc-num">{fmt(end.total)}</span>
              <span className="g-sub fc-num">{fmt(end.sncuCore)} SNCU network + {fmt(end.nbsu + end.mncu + end.portable)} from policy placements</span>
            </div>

            <div className="section-label">3 · From required to in-service, procurement and cost</div>
            <div className="fc-derived">
              <div>Of those, <strong>{fmt(end.effective)}</strong> are effectively in service at <FactorPill target="fc-util">{p.utilisationPct}%</FactorPill> utilisation <span className="muted">— the rest sit idle for want of trained staff or consumables.</span></div>
              <div>To get there you procure <strong>{fmt(end.cumAdded)}</strong> devices over {horizon} years — the yearly growth plus replacements as devices wear out (lifespan <FactorPill target="fc-life">{p.replacementYears} yr</FactorPill>).</div>
              <div>At <FactorPill target="fc-price">₹{p.unitPriceLakh} lakh</FactorPill> per device, that is a procurement cost of <strong>₹{fmt(Math.round(end.cumCostCr))} crore</strong>.</div>
            </div>
          </div>

          <div className="card">
            <h2>{selScn.tag} — year by year</h2>
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th>Year</th><th>SNCUs</th><th>SNCU devices</th><th>NBSU</th><th>MNCU</th><th>Portable</th>
                    <th>Total required</th><th>In service</th><th>New this year</th>
                  </tr>
                </thead>
                <tbody>
                  {selYears.map((y) => (
                    <tr key={y.year}>
                      <td>{yr(y.year)}{y.year === 0 ? ' (now)' : ''}</td>
                      <td>{fmt(y.sncu)}</td>
                      <td>{fmt(y.sncuCore)}</td>
                      <td>{fmt(y.nbsu)}</td>
                      <td>{fmt(y.mncu)}</td>
                      <td>{fmt(y.portable)}</td>
                      <td className="cell-strong">{fmt(y.total)}</td>
                      <td>{fmt(y.effective)}</td>
                      <td className="cell-gap">{fmt(y.added)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2>How this works &amp; caveats</h2>
            <ul className="src-list" style={{ paddingLeft: 18 }}>
              <li>The forecast starts from today's guidelines-based requirement ({fmt(Math.round(today.total))} devices) and grows the SNCU network at the chosen rate. Policy placements (NBSU, MNCU, portable) phase in evenly from now to {endYear}.</li>
              <li>The three scenarios are just preset factor values — Baseline, Moderate and Accelerated. Every value on the left is an editable assumption, so you can build your own scenario.</li>
              <li>This projects the number of devices <strong>required</strong>. "New this year" turns that into a procurement plan by adding replacements; multiply by the unit price for cost.</li>
              <li>Growth rates, prices and policy coverage are planning assumptions, not official targets. The published ~6.6% / yr SNCU growth (2014–2024) sets the baseline.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
