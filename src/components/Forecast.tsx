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
const COMP = [
  { key: 'sncuCore', label: 'SNCU network', color: '#0e7e92' },
  { key: 'nbsu', label: 'CPAP at NBSUs', color: '#c2912a' },
  { key: 'mncu', label: 'New MNCUs', color: '#123a5e' },
  { key: 'portable', label: 'Portable / transport', color: '#2f8f6b' },
] as const

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
      {[...COMP].reverse().filter((c) => payload.find((pl: any) => pl.dataKey === c.key)?.value > 0).map((c) => (
        <div key={c.key} style={{ color: c.color }}>{c.label}: <strong>{fmt(payload.find((pl: any) => pl.dataKey === c.key).value)}</strong></div>
      ))}
      <div style={{ borderTop: '1px solid #e4ebef', marginTop: 4, paddingTop: 4 }}>Total: <strong>{fmt(COMP.reduce((a, c) => a + (payload.find((pl: any) => pl.dataKey === c.key)?.value ?? 0), 0))}</strong></div>
    </div>
  ) : null

  return (
    <div className="layout-grid">
      {/* ---------------- controls ---------------- */}
      <div className="card card-tight sticky-col fc-panel">
        <div className="flex-between">
          <h2>Scenario &amp; factors</h2>
          <button className="btn link" onClick={resetSel} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4, background: 'none', border: 0, color: 'var(--c-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}>Reset scenario</button>
        </div>
        <p className="card-note" style={{ marginTop: 2 }}>Pick a scenario, then change any factor and watch every output update.</p>

        <div className="epi-switch" style={{ marginTop: 8 }}>
          {SCENARIOS.map((s) => (
            <button key={s.key} className={sel === s.key ? 'active' : ''} onClick={() => setSel(s.key)}>{s.tag}</button>
          ))}
        </div>
        <p className="card-note" style={{ marginTop: 8, fontSize: '0.78rem' }}>{selScn.blurb}</p>

        <div className="section-label" style={{ marginTop: 8 }}>Horizon</div>
        <Range id="fc-horizon" label="Years to project" value={horizon} min={3} max={7} step={1} suffix=" yr" onChange={setHorizon} />

        <div className="section-label">Infrastructure growth</div>
        <Range id="fc-growth" label="SNCU / NICU growth per year" value={p.sncuGrowthPct} min={0} max={20} step={0.5} suffix="%" onChange={(v) => setP({ sncuGrowthPct: v })} />

        <div className="section-label">Policy — new CPAP placements</div>
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
        <Range id="fc-util" label="Utilisation (training + consumables)" value={p.utilisationPct} min={50} max={100} step={5} suffix="%" onChange={(v) => setP({ utilisationPct: v })} />
        <div className="fc-row2">
          <Num id="fc-life" label="Device lifespan (yrs)" value={p.replacementYears} min={3} max={12} step={1} onChange={(v) => setP({ replacementYears: v })} />
          <Num id="fc-price" label="Unit price (₹ lakh)" value={p.unitPriceLakh} min={0.5} max={5} step={0.1} onChange={(v) => setP({ unitPriceLakh: v })} />
        </div>

        <p className="source-note" style={{ marginTop: 14 }}>
          <span className="src-prefix">Base:</span> {fmt(base.sncu)} SNCUs and {fmt(base.nbsu)} NBSUs today (RHS 2022-23); {base.cpapPerSncu.toFixed(1)} CPAP per SNCU from the guidelines inputs. Scenario values are editable assumptions, not fixed projections.
        </p>
      </div>

      {/* ---------------- results ---------------- */}
      <div>
        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-label">Devices required · {endYear}</div>
            <div className="kpi-value">{fmt(end.total)}</div>
            <div className="kpi-sub">{selScn.tag}, up from {fmt(today.total)} today</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Growth over {horizon} years</div>
            <div className="kpi-value">+{fmt(end.total - today.total)}</div>
            <div className="kpi-sub">more devices than today's requirement</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">New devices to procure</div>
            <div className="kpi-value">{fmt(end.cumAdded)}</div>
            <div className="kpi-sub">cumulative, incl. replacements over {horizon} yrs</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Procurement cost</div>
            <div className="kpi-value">₹{fmt(Math.round(end.cumCostCr))} Cr</div>
            <div className="kpi-sub">at ₹{p.unitPriceLakh.toFixed(1)} lakh per device</div>
          </div>
        </div>

        <div className="card">
          <h2>Devices required by year — the three scenarios</h2>
          <p className="card-note">Each line is a scenario's total CPAP devices required, year by year. The one you are editing ({selScn.tag}) is drawn bold.</p>
          <div className="chart-box" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 20, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#e4ebef" vertical={false} />
                <XAxis dataKey="year" tick={AxisTick} />
                <YAxis tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54} />
                <Tooltip content={<LineTip />} />
                {results.map((r) => (
                  <Line key={r.key} type="monotone" dataKey={r.key} name={r.tag} stroke={r.color}
                    strokeWidth={r.key === sel ? 3 : 1.6} strokeOpacity={r.key === sel ? 1 : 0.55}
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
          <h2>What drives {selScn.tag} — by component</h2>
          <p className="card-note">How the total for the scenario you are editing splits across the SNCU network and the new policy placements, each year.</p>
          <div className="chart-box" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} margin={{ top: 8, right: 20, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#e4ebef" vertical={false} />
                <XAxis dataKey="year" tick={AxisTick} />
                <YAxis tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54} />
                <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(14,126,146,0.06)' }} />
                {COMP.map((c) => (
                  <Bar key={c.key} dataKey={c.key} name={c.label} stackId="a" fill={c.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-row">
            {COMP.map((c) => (<span key={c.key}><span className="legend-dot" style={{ background: c.color }} />{c.label}</span>))}
          </div>
        </div>

        <div className="card">
          <details className="fc-lvl" open style={{ marginBottom: 0 }}>
            <summary>
              <span className="fc-lvl-name">Drill down — how {selScn.tag}'s {endYear} total is built</span>
              <span className="fc-lvl-meta">yellow pills are editable — click one to adjust it</span>
            </summary>
            <div style={{ padding: '16px', background: 'var(--c-surface)' }}>
              <div className="flow">
                <Node tone="grey" title="SNCUs today" val={fmt(base.sncu)} sub={String(baseYear)} />
                <Op>× grow <FactorPill target="fc-growth">{p.sncuGrowthPct}%</FactorPill> / yr for <FactorPill target="fc-horizon">{horizon} yr</FactorPill></Op>
                <Node tone="grey" title={`SNCUs in ${endYear}`} val={fmt(end.sncu)} />
                <Op>× {base.cpapPerSncu.toFixed(1)} CPAP per SNCU <span className="muted" style={{ fontSize: '0.72rem' }}>(from the guidelines inputs)</span></Op>
                <Node tone="teal" title="SNCU network devices" val={fmt(end.sncuCore)} sub="the core of the requirement" />
                <Op>+ CPAP at NBSUs = {fmt(base.nbsu)} NBSUs × <FactorPill target="fc-nbsu">{p.nbsuCpapSharePct}%</FactorPill> × <FactorPill target="fc-cpapNbsu">{p.cpapPerNbsu}</FactorPill> = +{fmt(end.nbsu)}</Op>
                <Op>+ new MNCUs = <FactorPill target="fc-mncu">{fmt(p.mncuByEnd)}</FactorPill> × <FactorPill target="fc-cpapMncu">{p.cpapPerMncu}</FactorPill> = +{fmt(end.mncu)}</Op>
                <Op>+ portable / transport = <FactorPill target="fc-portable">{p.portableSharePct}%</FactorPill> of {fmt(end.sncu)} SNCUs × <FactorPill target="fc-cpapPortable">{p.cpapPerPortable}</FactorPill> = +{fmt(end.portable)}</Op>
                <Node tone="out" title={`Total devices required · ${endYear}`} val={fmt(end.total)} sub="all four components added up" />
              </div>

              <div className="fc-derived">
                <div>Effectively in service at <FactorPill target="fc-util">{p.utilisationPct}%</FactorPill> utilisation: <strong>{fmt(end.effective)}</strong> <span className="muted">— the rest sit idle for want of trained staff or consumables.</span></div>
                <div>New devices to procure over {horizon} yrs (yearly growth + replacements, lifespan <FactorPill target="fc-life">{p.replacementYears} yr</FactorPill>): <strong>{fmt(end.cumAdded)}</strong></div>
                <div>Procurement cost at <FactorPill target="fc-price">₹{p.unitPriceLakh} lakh</FactorPill> per device: <strong>₹{fmt(Math.round(end.cumCostCr))} crore</strong></div>
              </div>
            </div>
          </details>
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
          <p className="card-note" style={{ marginTop: 10, marginBottom: 0 }}>
            <strong>In service</strong> is the total scaled by utilisation ({p.utilisationPct}%); the shortfall reflects devices idle for want of trained staff or consumables.
            <strong> New this year</strong> is what must be procured — the year's growth plus replacements (lifespan {p.replacementYears} yrs).
          </p>
        </div>

        <div className="card">
          <h2>How this works &amp; caveats</h2>
          <ul className="src-list" style={{ paddingLeft: 18 }}>
            <li>The forecast starts from today's guidelines-based requirement ({fmt(Math.round(today.total))} devices) and grows the SNCU network at the chosen rate. Policy placements (NBSU, MNCU, portable) phase in evenly from now to {endYear}.</li>
            <li>The three scenarios are just preset factor values — Baseline, Moderate and Accelerated. Every value on the left is an editable assumption, so you can build your own scenario.</li>
            <li>This projects the number of devices <strong>required</strong>. "New this year" turns that into a procurement plan by adding replacements; multiply by the unit price for cost.</li>
            <li>Growth rates, prices and policy coverage are planning assumptions, not official targets. The published ~6.6%/yr SNCU growth (2014–2024) sets the baseline.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
