import { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import type { Norms } from '../engine/method1'
import type { M2Norms } from '../engine/method2'
import { computeForecast } from '../engine/forecast'
import type { YearPoint } from '../engine/forecast'
import { GROWTH } from '../data/forecastData'
import { STATES } from '../data/states'
import { fmt, fmtPct } from '../utils/format'
import SourceNote from './SourceNote'

const EX = '#0e7e92' // existing
const EP = '#c2562b' // epidemiological
const NO = '#123a5e' // normative
const AxisTick = { fontSize: 11, fill: '#52616d', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }
const BASE = 2025
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031]

interface Props {
  m1: Norms
  m2: M2Norms
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{fmt(p.value)}</strong></div>
      ))}
    </div>
  )
}

export default function Forecast({ m1, m2 }: Props) {
  const [sncuRate, setSncuRate] = useState(GROWTH.nationalSncuCagr)
  const [rdsChange, setRdsChange] = useState(0)
  const [idrTrend, setIdrTrend] = useState(true)
  const [geo, setGeo] = useState('National')

  const { national, byState } = useMemo(
    () => computeForecast(m1, m2, GROWTH, {
      baseYear: BASE, years: YEARS, rdsAnnualChange: rdsChange, applyIdrTrend: idrTrend, idrCap: 1.0, sncuRateOverride: sncuRate,
    }),
    [m1, m2, rdsChange, idrTrend, sncuRate],
  )

  const raw: YearPoint[] = geo === 'National' ? national : byState[geo] ?? []
  const series = raw.map((p) => ({
    year: p.year,
    Existing: Math.round(p.existing),
    Epidemiological: Math.round(p.epidemiological),
    Normative: Math.round(p.normative),
  }))
  const first = series[0]
  const last = series[series.length - 1]
  const growth = (a: number, b: number) => (a > 0 ? (b - a) / a : 0)

  return (
    <div className="layout-grid">
      <div className="card card-tight sticky-col">
        <h2>Growth assumptions</h2>
        <p className="card-note">Base-year values come from your current settings on the Infrastructure &amp; Epidemiological tabs; each line grows by its own driver.</p>

        <div className="field">
          <label><span>SNCU network growth / yr</span><span className="range-val">{fmtPct(sncuRate, 1)}</span></label>
          <div className="range-row"><input type="range" min={0} max={0.15} step={0.005} value={sncuRate} onChange={(e) => setSncuRate(parseFloat(e.target.value))} /></div>
          <span className="hint">Drives the Current-network line. National history: 565 (2015) → 1,056 (2024) ≈ 7.2%/yr; per-state historical unavailable, so one national rate is used.</span>
          <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }]} note="SNCU counts (2015 & 2024)" />
        </div>

        <div className="field">
          <label><span>RDS prevalence change / yr</span><span className="range-val">{fmtPct(rdsChange, 1)}</span></label>
          <div className="range-row"><input type="range" min={-0.02} max={0.04} step={0.005} value={rdsChange} onChange={(e) => setRdsChange(parseFloat(e.target.value))} /></div>
          <span className="hint">Applied to the Epidemiological line. Held at 0 by default (only two national data points exist: 1.2% in 2002, 2.5% in 2024).</span>
        </div>

        <label className="switch-row" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={idrTrend} onChange={(e) => setIdrTrend(e.target.checked)} />
          <span>Trend institutional-delivery rate (NFHS-5 → 6), capped at 100%</span>
        </label>
        <SourceNote refs={[{ key: 'nfhs5', page: 'FR375' }, { key: 'nfhs6', page: 'fact sheet' }]} note="institutional-delivery trend (NFHS-5 → 6)" />

        <hr className="divider" />
        <span className="hint">Births: NCP projections (declining ~1.3%/yr nationally) drive the Normative &amp; Epidemiological lines.</span>
        <SourceNote refs={[{ key: 'ncpProj', page: 'Tables 17 / 17A' }]} note="projected births" />
      </div>

      <div>
        <div className="card">
          <div className="flex-between">
            <h2>CPAP demand forecast · {geo} · 2025–2031</h2>
            <label className="ctrl-inline">
              <span className="muted">Geography</span>
              <select value={geo} onChange={(e) => setGeo(e.target.value)}>
                <option value="National">National</option>
                {STATES.map((s) => <option key={s.state} value={s.state}>{s.state}</option>)}
              </select>
            </label>
          </div>
          <p className="card-note">
            Three trajectories, each from today's estimate: <strong style={{ color: EX }}>Current network</strong> grows with the SNCU
            network; <strong style={{ color: EP }}>Epidemiological</strong> with births × institutional delivery (× RDS);{' '}
            <strong style={{ color: NO }}>Normative</strong> with births only. The gaps show how procurement need diverges.
          </p>
          <div className="chart-box" style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 24, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#e4ebef" />
                <XAxis dataKey="year" tick={AxisTick} />
                <YAxis tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Existing" name="Current network" stroke={EX} strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Epidemiological" stroke={EP} strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Normative" stroke={NO} strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {first && last && (
          <div className="kpi-row">
            <div className="kpi accent-teal">
              <div className="kpi-label">Current network · 2031</div>
              <div className="kpi-value">{fmt(last.Existing)}</div>
              <div className="kpi-sub">{fmtPct(growth(first.Existing, last.Existing))} vs 2025</div>
            </div>
            <div className="kpi accent-bad">
              <div className="kpi-label">Epidemiological · 2031</div>
              <div className="kpi-value">{fmt(last.Epidemiological)}</div>
              <div className="kpi-sub">{fmtPct(growth(first.Epidemiological, last.Epidemiological))} vs 2025</div>
            </div>
            <div className="kpi accent-navy">
              <div className="kpi-label">Normative · 2031</div>
              <div className="kpi-value">{fmt(last.Normative)}</div>
              <div className="kpi-sub">{fmtPct(growth(first.Normative, last.Normative))} vs 2025</div>
            </div>
            <div className="kpi accent-good">
              <div className="kpi-label">Current ÷ Epidemiological</div>
              <div className="kpi-value">{last.Epidemiological > 0 ? fmtPct(last.Existing / last.Epidemiological) : '—'}</div>
              <div className="kpi-sub">network coverage of need, 2031</div>
            </div>
          </div>
        )}

        <div className="card">
          <h2>Year-by-year</h2>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>Year</th><th style={{ color: EX }}>Current network</th><th style={{ color: EP }}>Epidemiological</th><th style={{ color: NO }}>Normative</th></tr>
              </thead>
              <tbody>
                {series.map((p) => (
                  <tr key={p.year}>
                    <td>{p.year}</td>
                    <td>{fmt(p.Existing)}</td>
                    <td>{fmt(p.Epidemiological)}</td>
                    <td>{fmt(p.Normative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>How to read it</h2>
          <ul className="src-list" style={{ paddingLeft: 18 }}>
            <li><strong>Current network</strong> rises with the SNCU network (~7%/yr) — the deliverable capacity if build-out continues at its historical pace.</li>
            <li><strong>Epidemiological</strong> tracks clinical need: births are projected to fall while institutional delivery rises, so it stays broadly flat.</li>
            <li><strong>Normative</strong> follows births only, so it declines gently as the birth cohort shrinks.</li>
            <li>Where the current-network line rises toward Epidemiological, the infrastructure gap narrows; the distance to Normative is the full build-out headroom.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
