import { Fragment, useDeferredValue, useId, useMemo, useState } from 'react'
import {
  ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Customized,
} from 'recharts'
import type { Norms } from '../engine/method1'
import type { M3Norms } from '../engine/method3'
import { computeM3 } from '../engine/method3'
import { STATES } from '../data/states'
import { SCENARIOS } from '../engine/methodForecast'
import type { ForecastBase } from '../engine/methodForecast'
import { LEVERS, simulate, deriveStarters, leverEffects, projectLevers, inUseAt } from '../engine/forecastSim'
import type { LeverKey, LeverValues } from '../engine/forecastSim'
import { fmt } from '../utils/format'
import { MNCU_TIERS, ALS_AMBULANCES, BLS_AMBULANCES, ALS_SOURCE, MNCU_SOURCE } from '../data/forecastInputs'
import { ResetIcon } from './Icon'
import { ExplainTitle, ExplainHere, useExplain } from './Explain'

// The Forecasting tab: every combination of the demand factors is simulated; three scenarios
// (Baseline / Moderate / Accelerated) are picked from them, and any line can be selected to see
// what its devices in place are made of, year by year.

const AxisTick = { fontSize: 11, fill: 'var(--chart-axis)', fontFamily: 'var(--font-data)' }
const MINE = 'var(--s-mine)' // "your combination" — checked for colour-blind separation against the three scenario colours
const CLOUD = 'var(--s-cloud)' // the simulated combinations (faint lines + shaded range)
const NEED = 'var(--s-need)' // the public-need ceiling
const SCN_COLOR: Record<string, string> = Object.fromEntries(SCENARIOS.map((s) => [s.key, s.color]))
const CLOUD_LINES = 750 // about this many combinations are drawn as faint lines; the shaded range uses all of them
const COMP = [
  { key: 'sncuCore', label: 'SNCU network', color: 'var(--s-sncu)' },
  { key: 'nbsu', label: 'CPAP at NBSUs', color: 'var(--s-nbsu)' },
  { key: 'mncu', label: 'MNCUs', color: 'var(--s-mncu)' },
  { key: 'transport', label: 'CPAP in transport', color: 'var(--s-transport)' },
] as const

const LABEL: Record<LeverKey, string> = {
  sncuGrowthPct: 'SNCU growth per year',
  nbsuCpapSharePct: 'NBSUs with CPAP',
  cpapPerNbsu: 'CPAP per NBSU',
  mncuSharePct: 'Hospitals with an MNCU',
  cpapPerMncu: 'CPAP per MNCU',
  alsCpapSharePct: 'CPAP in transport',
  utilisationPct: 'Utilisation',
}
const UNIT: Record<LeverKey, string> = { sncuGrowthPct: '%', nbsuCpapSharePct: '%', cpapPerNbsu: '', mncuSharePct: '%', cpapPerMncu: '', alsCpapSharePct: '%', utilisationPct: '%' }
const show = (k: LeverKey, v: number) => `${v}${UNIT[k]}`
const TESTED: Record<LeverKey, (lo: string, hi: string) => string> = {
  sncuGrowthPct: (lo, hi) => `SNCU growth from ${lo} to ${hi} a year`,
  nbsuCpapSharePct: (lo, hi) => `CPAP at ${lo} to ${hi} of NBSUs`,
  cpapPerNbsu: (lo, hi) => `${lo} to ${hi} CPAP per NBSU`,
  mncuSharePct: (lo, hi) => `an MNCU at ${lo} to ${hi} of eligible facilities`,
  cpapPerMncu: (lo, hi) => `${lo} to ${hi} CPAP per MNCU`,
  alsCpapSharePct: (lo, hi) => `CPAP in ${lo} to ${hi} of ALS ambulances`,
  utilisationPct: (lo, hi) => `utilisation from ${lo} to ${hi}`,
}
const AT: Record<LeverKey, (v: string) => string> = {
  sncuGrowthPct: (v) => `${v} SNCU growth a year`,
  nbsuCpapSharePct: (v) => `CPAP at ${v} of NBSUs`,
  cpapPerNbsu: (v) => `${v} CPAP per NBSU`,
  mncuSharePct: (v) => `an MNCU at ${v} of eligible facilities`,
  cpapPerMncu: (v) => `${v} CPAP per MNCU`,
  alsCpapSharePct: (v) => `CPAP in ${v} of ALS ambulances`,
  utilisationPct: (v) => `${v} utilisation`,
}
const listAnd = (items: string[]) => items.slice(0, -1).join(', ') + (items.length > 1 ? ' and ' : '') + items[items.length - 1]
const kTick = (v: number) => (v === 0 ? '0' : `${v / 1000}k`)

// The values the simulation tries for a factor, in words, read from its grid: a range and step where they
// are evenly spaced ("0% to 100%, in steps of 10%"), otherwise a short list ("2, 4 and 6").
function triedText(key: LeverKey): string {
  const grid = LEVERS.find((l) => l.key === key)!.grid
  const v = (x: number) => show(key, x)
  const stepOf = (g: number[]) => {
    const d = g.slice(1).map((x, i) => +(x - g[i]).toFixed(4))
    return d.every((x) => x === d[0]) ? d[0] : null
  }
  const range = (g: number[], step: number) => `${v(g[0])} to ${v(g[g.length - 1])}, in steps of ${v(step)}`
  if (grid.length <= 4) return listAnd(grid.map(v))
  const step = stepOf(grid)
  if (step !== null) return range(grid, step)
  // one value off an even spacing (e.g. the past SNCU growth rate added to whole numbers)
  for (let i = 1; i < grid.length - 1; i++) {
    const rest = grid.filter((_, j) => j !== i)
    const s = stepOf(rest)
    if (s !== null) return `${range(rest, s)}, plus ${v(grid[i])}`
  }
  // evenly spaced at first, then a few more values (e.g. utilisation: steps of 10, then 85, 90, 95)
  let k = 3
  while (k < grid.length && stepOf(grid.slice(0, k + 1)) !== null) k++
  const head = grid.slice(0, k)
  const s = stepOf(head)
  return s !== null && k < grid.length ? `${range(head, s)}, then ${listAnd(grid.slice(k).map(v))}` : listAnd(grid.map(v))
}

const START: LeverValues = { sncuGrowthPct: 8, nbsuCpapSharePct: 50, cpapPerNbsu: 1.5, mncuSharePct: 20, cpapPerMncu: 4, alsCpapSharePct: 20, utilisationPct: 60 }
const UTIL_NOW = LEVERS.find((l) => l.key === 'utilisationPct')!.lo // share of devices in use today
const SNCU_PAST = LEVERS.find((l) => l.key === 'sncuGrowthPct')!.lo // SNCU growth a year, 2014–2024
const UTIL_DEF = 'Utilisation is the share of devices that are actually working and in use. It depends on staff training and motivation; procurement of devices, consumables and spare parts; repairs and maintenance; the price of commodities; and upcoming innovations.'

// Faint line per sampled combination, drawn with the chart's own scales. Memoised on the scales so
// hovering the chart (which re-renders it) doesn't rebuild hundreds of paths.
function CloudLayer({ xAxisMap, yAxisMap, lines, year0 }: any) {
  const xs = xAxisMap ? (Object.values(xAxisMap)[0] as any).scale : null
  const ys = yAxisMap ? (Object.values(yAxisMap)[0] as any).scale : null
  const key = xs && ys ? `${xs.range()}|${ys.range()}|${ys.domain()}` : ''
  return useMemo(() => (xs && ys ? (
    <g pointerEvents="none">
      {lines.map((totals: number[], i: number) => (
        <path key={i} d={totals.map((v, t) => `${t ? 'L' : 'M'}${xs(year0 + t)},${ys(v)}`).join('')}
          fill="none" stroke={CLOUD} strokeOpacity={0.045} strokeWidth={1} />
      ))}
    </g>
  ) : null), [key, lines, year0]) // `key` stands in for the scales, which are new objects every render
}

// A labelled slider. Pass `def` to get a reset button that puts it back to that starting value.
function Range({ id, label, value, min, max, step, suffix = '', def, onChange }: {
  id?: string; label: string; value: number; min: number; max: number; step: number; suffix?: string; def?: number; onChange: (v: number) => void
}) {
  const inputId = useId()
  const changed = def !== undefined && value !== def
  return (
    <div className="field" id={id} style={{ marginBottom: 12 }}>
      <div className="fc-range-head">
        <label htmlFor={inputId}>{label}</label>
        <span className="fc-normv">{value}{suffix}</span>
        {def !== undefined && (
          <button type="button" className="fc-reset" disabled={!changed} onClick={() => onChange(def)}
            title={changed ? `Reset to ${def}${suffix}` : 'This factor is at its starting value.'} aria-label={`Reset ${label} to ${def}${suffix}`}><ResetIcon /></button>
        )}
      </div>
      <input id={inputId} type="range" min={min} max={max} step={step} value={value} style={{ width: '100%', accentColor: 'var(--c-primary)' }}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  )
}

// The foot of every scenario card: devices in place → × utilisation → devices in use.
function InUseCalc({ endYear, inPlace, util, inUse, pctNeed }: { endYear: number; inPlace: number; util: number; inUse: number; pctNeed: number }) {
  return (
    <div className="fc-calc">
      <small className="fc-calc-year">In {endYear}</small>
      <div><span>Devices in place</span><b>{fmt(inPlace)}</b></div>
      <div><span>× Utilisation</span><b>{util}%</b></div>
      <div className="fc-calc-out"><span>= Devices in use</span><b>{fmt(inUse)}</b></div>
      <small>This is {pctNeed}% of the public need.</small>
    </div>
  )
}

export default function Forecast({ m1, m3 }: { m1: Norms; m3: M3Norms }) {
  const base: ForecastBase = useMemo(() => ({
    sncu: STATES.reduce((a, s) => a + s.sncu, 0),
    nbsu: STATES.reduce((a, s) => a + s.nbsu, 0),
    cpapPerSncu: m1.avgSncuBeds * m1.cpapPerBed * (1 + m1.buffer),
    mncuSites: m3.levels.filter((l) => MNCU_TIERS.includes(l.key)).reduce((a, l) => a + l.count, 0),
    alsAmbulances: ALS_AMBULANCES,
  }), [m1, m3])
  const need = useMemo(() => computeM3(m3), [m3])
  const ceiling = need.totals.devices
  const chcShare = (need.sections.find((s) => s.key === 'chc')?.devices ?? 0) / (need.totals.rawDevices || 1)
  const hospitals = m3.levels.filter((l) => l.key !== 'chc').reduce((a, l) => a + l.count, 0)

  const [horizonInput, setHorizon] = useState(10)
  const horizon = useDeferredValue(horizonInput) // the slider moves at once; the charts catch up a beat later
  const [mine, setMine] = useState<LeverValues>(START)
  const [sel, setSel] = useState('s3') // the selected line: 's1'…'s3' or 'mine'; Accelerated when the tab opens
  const setLever = (k: LeverKey, v: number) => setMine((prev) => ({ ...prev, [k]: v }))
  const mineChanged = LEVERS.some((l) => mine[l.key] !== START[l.key])
  const mineExplain = useExplain('fc-your-combination')

  const ens = useMemo(() => simulate(base, horizon, ceiling), [base, horizon, ceiling])
  const starters = useMemo(() => deriveStarters(base, horizon, ceiling), [base, horizon, ceiling])
  const effects = useMemo(() => leverEffects(ens), [ens])
  const mineYears = useMemo(() => projectLevers(base, mine, horizon), [base, mine, horizon])
  const cloudEvery = Math.ceil(ens.runs.length / CLOUD_LINES)
  const cloud = useMemo(() => ens.runs.filter((_, i) => i % cloudEvery === 0).map((r) => r.inPlace.map((_, t) => inUseAt(r, t))), [ens, cloudEvery])

  const baseYear = new Date().getFullYear()
  const endYear = baseYear + horizon
  const yr = (t: number) => baseYear + t
  const pctOfNeed = (v: number) => Math.round((v / ceiling) * 100)

  const endBand = ens.bands[horizon]
  const reached = ens.runs.filter((r) => r.reachYear !== null).length
  const reachedWithin = ens.runs.filter((r) => r.reachYear !== null && LEVERS.every((l) => r.levers[l.key] <= l.hi)).length
  const mineEnd = mineYears[horizon]
  const mineReach = mineYears.findIndex((y) => y.effective >= ceiling)
  const acc = starters[2]


  // ---------------- fan chart (devices in use) ----------------
  const chartData = ens.bands.map((b, t) => ({
    year: yr(t),
    band: [Math.round(b.p10), Math.round(b.p90)],
    ...Object.fromEntries(starters.map((s) => [s.key, Math.round(s.years[t].effective)])),
    mine: Math.round(mineYears[t].effective),
  }))
  // The four lines a viewer can select: the three scenarios, then their own combination.
  const lineCards = [
    ...starters.map((s) => ({ key: s.key, name: s.tag, color: SCN_COLOR[s.key], levers: s.levers, years: s.years, beyond: s.ambition > 1.0001 })),
    { key: 'mine', name: 'Your combination', color: MINE, levers: mine, years: mineYears, beyond: false },
  ]
  const selLine = lineCards.find((c) => c.key === sel) ?? lineCards.find((c) => c.key === 's3')!
  const selLabel = selLine.key === 'mine' ? 'your combination' : selLine.name
  const selYears = selLine.years
  const today = selYears[0]
  const yMax = Math.ceil((Math.max(ceiling, endBand.max, mineEnd.effective, acc.years[horizon].effective) * 1.04) / 5000) * 5000
  const yTicks = Array.from({ length: yMax / 5000 + 1 }, (_, i) => i * 5000)

  const TipRow = ({ color, value, label, dashed }: { color: string; value: string; label: string; dashed?: boolean }) => (
    <div className="sim-tip-row">
      <span className={`sim-key${dashed ? ' dash' : ''}`} style={dashed ? undefined : { background: color }} />
      <b>{value}</b><span>{label}</span>
    </div>
  )
  const FanTip = ({ active, label }: any) => {
    if (!active || label == null) return null
    const t = label - baseYear
    const b = ens.bands[t]
    return (
      <div className="chart-tip sim-tip">
        <div className="sim-tip-head">{label}</div>
        <TipRow color={MINE} value={fmt(mineYears[t].effective)} label="Your combination" />
        {[...starters].reverse().map((s) => <TipRow key={s.key} color={SCN_COLOR[s.key]} value={fmt(s.years[t].effective)} label={s.tag} />)}
        <div className="sim-tip-sep" />
        <div className="sim-tip-row"><span className="sim-key band" /><b>{fmt(b.p10)} to {fmt(b.p90)}</b><span>8 in 10 combinations</span></div>
        <TipRow color={NEED} value={fmt(ceiling)} label="Public need" dashed />
      </div>
    )
  }

  // ---------------- which factors matter most ----------------
  const swings = effects
    .map((e) => ({ ...e, lo: e.means[0], hi: e.means[e.means.length - 1] }))
    .sort((a, b) => (b.hi.total - b.lo.total) - (a.hi.total - a.lo.total))
  const sMin = Math.min(...swings.map((s) => s.lo.total))
  const sMax = Math.max(...swings.map((s) => s.hi.total))
  const sx = (v: number) => ((v - sMin) / (sMax - sMin || 1)) * 100

  // ---------------- what the selected line's devices in place are made of ----------------
  const breakdownData = selYears.map((y) => ({
    year: yr(y.year),
    sncuCore: Math.round(y.sncuCore), nbsu: Math.round(y.nbsu), mncu: Math.round(y.mncu), transport: Math.round(y.transport),
  }))
  const BarTip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div className="chart-tip sim-tip">
      <div className="sim-tip-head">{label}</div>
      {[...COMP].reverse().filter((c) => (payload.find((pl: any) => pl.dataKey === c.key)?.value ?? 0) > 0).map((c) => (
        <TipRow key={c.key} color={c.color} value={fmt(payload.find((pl: any) => pl.dataKey === c.key).value)} label={c.label} />
      ))}
      <div className="sim-tip-sep" />
      <div className="sim-tip-row"><b>{fmt(COMP.reduce((a, c) => a + (payload.find((pl: any) => pl.dataKey === c.key)?.value ?? 0), 0))}</b><span>Devices in place</span></div>
    </div>
  ) : null

  return (
    <div>
      <div className="card">
        <h2>How the forecast works</h2>
        <div className="fc-how">
          <p className="card-note">
            This forecast estimates how the demand for CPAP devices in public facilities grows year on year over the
            next {horizon} years, up to {endYear}. That growth does not depend on one thing alone. It depends on several
            factors working together: how fast new newborn care units open, how many of them get CPAP, and how many of
            the devices are actually kept working. The forecast is built on seven such factors:
          </p>
          <div className="fc-how-factors">
            <div className="fc-how-box">
              <div className="fc-how-title">SNCUs <small>special newborn care units</small></div>
              <p><b>SNCU growth</b> is how fast the number of SNCUs grows each year.</p>
              <p className="fc-how-tried">Modelled for the value range: {triedText('sncuGrowthPct')}, the past rate</p>
            </div>
            <div className="fc-how-box">
              <div className="fc-how-title">NBSUs <small>newborn stabilisation units</small></div>
              <p><b>NBSUs with CPAP</b> is how many NBSUs get CPAP.</p>
              <p className="fc-how-tried">Modelled for the value range: {triedText('nbsuCpapSharePct')}</p>
              <p><b>CPAP per NBSU</b> is how many CPAP each of these NBSUs gets.</p>
              <p className="fc-how-tried">Modelled for the value range: {triedText('cpapPerNbsu')}</p>
            </div>
            <div className="fc-how-box">
              <div className="fc-how-title">MNCUs <small>mother-newborn care units</small></div>
              <p><b>Hospitals with an MNCU</b> is how many district hospitals and medical colleges open one.</p>
              <p className="fc-how-tried">Modelled for the value range: {triedText('mncuSharePct')}</p>
              <p><b>CPAP per MNCU</b> is how many CPAP each MNCU has.</p>
              <p className="fc-how-tried">Modelled for the value range: {triedText('cpapPerMncu')}</p>
            </div>
            <div className="fc-how-box">
              <div className="fc-how-title">CPAP in transport <small>advanced life support (ALS) ambulances</small></div>
              <p><b>CPAP in transport</b> is how many ALS ambulances carry a CPAP for moving sick newborns.</p>
              <p className="fc-how-tried">Modelled for the value range: {triedText('alsCpapSharePct')}</p>
            </div>
            <div className="fc-how-box">
              <div className="fc-how-title">Devices in use</div>
              <p><b>Utilisation</b> is how many of all these devices are actually working and in use. It depends on staff training and motivation; procurement of devices, consumables and spare parts; repairs and maintenance; the price of commodities; and upcoming innovations.</p>
              <p className="fc-how-tried">Modelled for the value range: {triedText('utilisationPct')}</p>
            </div>
          </div>
          <p className="card-note">
            We worked out the devices in use each year for every possible combination of values for these factors.
            From these, we picked three scenarios:
          </p>
          <div className="fc-how-scn">
            <div className="fc-how-box">
              <div className="fc-how-title" style={{ color: 'var(--t-baseline)' }}><span className="sim-key" style={{ background: SCN_COLOR.s1 }} />Baseline</div>
              <p>Things carry on as they are today. SNCUs keep growing at the past rate, and nothing else changes.</p>
            </div>
            <div className="fc-how-box">
              <div className="fc-how-title" style={{ color: 'var(--t-moderate)' }}><span className="sim-key" style={{ background: SCN_COLOR.s2 }} />Moderate expansion</div>
              <p>The factors improve part of the way. This closes half the gap between Baseline and the public need.</p>
            </div>
            <div className="fc-how-box">
              <div className="fc-how-title" style={{ color: 'var(--t-accelerated)' }}><span className="sim-key" style={{ background: SCN_COLOR.s3 }} />Accelerated</div>
              <p>The factors improve enough for the devices in use to reach the public need of <b>{fmt(ceiling)} devices</b> by {endYear}. This is the most CPAP the public sector could need.</p>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 380 }}>
          <ExplainHere id="fc-years" />
          <Range id="fc-horizon" label="Years to project" value={horizonInput} min={5} max={12} step={1} suffix={` yr (to ${baseYear + horizonInput})`} onChange={setHorizon} />
        </div>
      </div>

      <div className="layout-grid">
        <div className="card card-tight sticky-col fc-panel">
          <div className="flex-between">
            <h2>Your combination</h2>
            <div className="explain-head" style={{ alignItems: 'center' }}>
              <button type="button" className="fc-reset-all" disabled={!mineChanged} onClick={() => setMine(START)}>Reset all</button>
              {mineExplain.bulb}
            </div>
          </div>
          {mineExplain.panel}
          <p className="card-note" style={{ marginTop: 2 }}>Set a value for each factor to build one combination. It shows on the chart as the "Your combination" line. The reset button beside a factor puts it back to its starting value.</p>

          <Range label="SNCU growth per year" value={mine.sncuGrowthPct} def={START.sncuGrowthPct} min={0} max={20} step={0.1} suffix="%" onChange={(v) => setLever('sncuGrowthPct', v)} />
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            This is how fast the number of SNCUs (special newborn care units) grows each year, starting from {fmt(base.sncu)} today. Each SNCU has {base.cpapPerSncu.toFixed(1)} CPAP. The number grew about {SNCU_PAST}% a year from 2014 to 2024.
          </p>
          <Range label={`NBSUs with CPAP by ${endYear}`} value={mine.nbsuCpapSharePct} def={START.nbsuCpapSharePct} min={0} max={100} step={5} suffix="% of NBSUs" onChange={(v) => setLever('nbsuCpapSharePct', v)} />
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            This is the share of the {fmt(base.nbsu)} NBSUs (newborn stabilisation units) that have CPAP. NBSUs are smaller units that stabilise sick newborns before referral. The FBNC guidelines do not provide CPAP at NBSUs today, so none are counted now.
          </p>
          <Range label="CPAP per NBSU" value={mine.cpapPerNbsu} def={START.cpapPerNbsu} min={1} max={4} step={0.5} onChange={(v) => setLever('cpapPerNbsu', v)} />
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            This is how many CPAP each NBSU with CPAP gets. An NBSU usually has 4 beds.
          </p>
          <Range label={`Hospitals with an MNCU by ${endYear}`} value={mine.mncuSharePct} def={START.mncuSharePct} min={0} max={100} step={5} suffix="% of eligible" onChange={(v) => setLever('mncuSharePct', v)} />
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            This is the share of the {fmt(base.mncuSites)} district hospitals and medical colleges that have an MNCU (mother-newborn care unit). Each hospital has at most one MNCU.
          </p>
          <Range label="CPAP per MNCU" value={mine.cpapPerMncu} def={START.cpapPerMncu} min={1} max={8} step={1} onChange={(v) => setLever('cpapPerMncu', v)} />
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            The FBNC 2025 guidelines suggest 4 CPAP for a 12-bed MNCU.
          </p>
          <Range label={`CPAP in transport by ${endYear}`} value={mine.alsCpapSharePct} def={START.alsCpapSharePct} min={0} max={100} step={5} suffix="% of ALS" onChange={(v) => setLever('alsCpapSharePct', v)} />
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            This is the share of the {fmt(base.alsAmbulances)} advanced life support (ALS) ambulances that carry a CPAP for newborn transfers. Each of these ambulances carries one CPAP.
          </p>
          <Range label={`Utilisation by ${endYear}`} value={mine.utilisationPct} def={START.utilisationPct} min={30} max={100} step={5} suffix="%" onChange={(v) => setLever('utilisationPct', v)} />
          <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
            Utilisation is the share of devices that are actually working and in use. It depends on staff training and
            motivation; procurement of devices, consumables and spare parts; repairs and maintenance; the price of
            commodities; and upcoming innovations. It moves evenly from about {UTIL_NOW}% today to the value you set here.
          </p>

          <ExplainHere id="fc-your-result" />
          <div className="sim-mine">
            Your combination has <strong>{fmt(mineEnd.total)}</strong> devices in place by {endYear}. At{' '}
            {mine.utilisationPct}% utilisation, <strong>{fmt(mineEnd.effective)}</strong> are in use, which
            is <strong>{pctOfNeed(mineEnd.effective)}%</strong> of the public need.{' '}
            {mineReach >= 0 ? <>It reaches the need in <strong>{yr(mineReach)}</strong>.</> : <>It does not reach the need by {endYear}.</>}
          </div>

          <p className="source-note" style={{ marginTop: 14 }}>
            <span className="src-prefix">Base:</span> The forecast starts from {fmt(base.sncu)} SNCUs and {fmt(base.nbsu)} NBSUs today (RHS 2022-23). Each SNCU has {base.cpapPerSncu.toFixed(1)} CPAP, taken from the guidelines-based inputs. There are {fmt(base.mncuSites)} hospitals eligible for an MNCU ({MNCU_SOURCE}) and {fmt(base.alsAmbulances)} ALS ambulances ({ALS_SOURCE}).
          </p>
        </div>

        <div>
          <div className="card">
            <h2>Devices in use each year, across every combination</h2>
            <p className="card-note">
              Three of the coloured lines are the scenarios. <strong style={{ color: 'var(--t-baseline)' }}>Baseline</strong> keeps to
              today's path, <strong style={{ color: 'var(--t-moderate)' }}>Moderate expansion</strong> closes half the gap to the
              public need, and <strong style={{ color: 'var(--t-accelerated)' }}>Accelerated</strong> reaches the need
              by {endYear}. The fourth line is <strong style={{ color: 'var(--t-mine)' }}>your combination</strong>. Change
              the values in the panel on the left to compare it with the scenarios. Click a card below to see that line in detail.
            </p>

            <ExplainTitle id="fc-line-cards" as="h3" className="fc-sub">Pick a scenario to deep dive</ExplainTitle>
            <div className="fc-lines" role="group" aria-label="Lines on the chart">
              {lineCards.map((c) => {
                const L = c.levers
                const ce = c.years[horizon]
                return (
                  <button key={c.key} type="button" className={`fc-line-card${sel === c.key ? ' on' : ''}`} style={{ ['--line' as string]: c.color }}
                    aria-pressed={sel === c.key} onClick={() => setSel(c.key)}>
                    <div className="fc-line-head"><span className="sim-key" style={{ background: c.color }} />{c.name}</div>
                    <div className="fc-line-rows">
                      <div><span>SNCU growth</span><b>{L.sncuGrowthPct}% a year</b></div>
                      <div><span>NBSUs with CPAP</span><b>{L.nbsuCpapSharePct ? `${L.nbsuCpapSharePct}%` : 'none'}</b></div>
                      <div><span>CPAP per NBSU</span><b>{L.nbsuCpapSharePct ? L.cpapPerNbsu : '–'}</b></div>
                      <div><span>Hospitals with an MNCU</span><b>{L.mncuSharePct ? `${L.mncuSharePct}%` : 'none'}</b></div>
                      <div><span>CPAP per MNCU</span><b>{L.mncuSharePct ? L.cpapPerMncu : '–'}</b></div>
                      <div><span>CPAP in transport</span><b>{L.alsCpapSharePct ? `${L.alsCpapSharePct}%` : 'none'}</b></div>
                      <div><span>SNCUs in {endYear}</span><b>{fmt(ce.sncu)}</b></div>
                    </div>
                    {c.beyond && <div className="sim-flag">To reach the need this soon, some factors go past the scenarios' top values.</div>}
                    <InUseCalc endYear={endYear} inPlace={ce.total} util={L.utilisationPct} inUse={ce.effective} pctNeed={pctOfNeed(ce.effective)} />
                  </button>
                )
              })}
            </div>
            <p className="source-note fc-util-note">{UTIL_DEF}</p>

            <div className="chart-box" style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 22, right: 20, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="year" tick={AxisTick} tickLine={false} axisLine={{ stroke: 'var(--chart-axis-line)' }} />
                  <YAxis tick={AxisTick} tickFormatter={kTick} width={44} domain={[0, yMax]} ticks={yTicks} tickLine={false} axisLine={false} />
                  <Tooltip content={<FanTip />} cursor={{ stroke: 'var(--chart-cursor)', strokeWidth: 1 }} isAnimationActive={false} />
                  <Area dataKey="band" stroke="none" fill={CLOUD} fillOpacity={0.12} isAnimationActive={false} activeDot={false} />
                  <Customized component={<CloudLayer lines={cloud} year0={baseYear} />} />
                  <ReferenceLine y={ceiling} stroke={NEED} strokeDasharray="6 4" strokeWidth={1.5}
                    label={{ value: `Public need · ${fmt(ceiling)}`, position: 'insideTopLeft', fill: NEED, fontSize: 11, fontWeight: 700 }} />
                  {starters.map((s) => (
                    <Line key={s.key} type="linear" dataKey={s.key} stroke={SCN_COLOR[s.key]} strokeWidth={s.key === sel ? 3 : 2}
                      strokeLinecap="round" strokeLinejoin="round" dot={false} activeDot={{ r: 4, stroke: 'var(--chart-dot-ring)', strokeWidth: 2 }} isAnimationActive={false} />
                  ))}
                  <Line type="linear" dataKey="mine" stroke={MINE} strokeWidth={sel === 'mine' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round"
                    dot={false} activeDot={{ r: 4, stroke: 'var(--chart-dot-ring)', strokeWidth: 2 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="sim-legend">
              <span style={{ fontWeight: sel === 'mine' ? 700 : 400 }}><span className="sim-key" style={{ background: MINE }} />Your combination <b>{fmt(mineEnd.effective)}</b></span>
              {starters.map((s) => (
                <span key={s.key} style={{ fontWeight: s.key === sel ? 700 : 400 }}><span className="sim-key" style={{ background: SCN_COLOR[s.key] }} />{s.tag} <b>{fmt(s.years[horizon].effective)}</b></span>
              ))}
              <span><span className="sim-key dash" />Public need <b>{fmt(ceiling)}</b></span>
              <span><span className="sim-key band" />8 in 10 combinations</span>
              <span><span className="sim-key thin" />One combination (1 in {cloudEvery} shown)</span>
            </div>
            <p className="source-note" style={{ marginTop: 6 }}>Numbers in the legend are devices in use in {endYear}.</p>

            <ExplainTitle id="fc-breakdown" as="h3" className="fc-sub">What makes up the devices in place for {selLabel}</ExplainTitle>
            <p className="card-note">The devices in place come from four parts. The SNCU network makes up most of them. The other three parts are the new CPAP at NBSUs, at MNCUs and in transport, which are added a little more each year. Hover over a year to see each part.</p>
            <div className="chart-box" style={{ height: 290 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 8, right: 20, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="year" tick={AxisTick} />
                  <YAxis tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54} />
                  <Tooltip content={<BarTip />} cursor={{ fill: 'color-mix(in srgb, var(--c-primary) 7%, transparent)' }} />
                  {COMP.map((c) => (<Bar key={c.key} dataKey={c.key} name={c.label} stackId="a" fill={c.color} />))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-row">
              {COMP.map((c) => (<span key={c.key}><span className="legend-dot" style={{ background: c.color }} />{c.label}</span>))}
            </div>
          </div>

          <div className="card">
            <ExplainTitle id="fc-factors">Which factors change the number most</ExplainTitle>
            <p className="card-note">
              Each bar shows how far the devices in use in {endYear} move when one factor goes from its lowest tested value
              (left end) to its highest (right end). Each end is the average over every combination of the other six
              factors. A longer bar means the factor matters more.
            </p>
            <div className="sim-tornado">
              {swings.map((s) => (
                <div key={s.lever.key} className="sim-trow">
                  <div className="sim-tlab">
                    {LABEL[s.lever.key]}
                    <small>{show(s.lever.key, s.lo.value)} → {show(s.lever.key, s.hi.value)}: {fmt(s.lo.total)} → {fmt(s.hi.total)}</small>
                  </div>
                  <div className="sim-ttrack">
                    <div className="sim-tbar" style={{ left: `${sx(s.lo.total)}%`, width: `${sx(s.hi.total) - sx(s.lo.total)}%` }} />
                  </div>
                  <div className="sim-tval">+{fmt(s.hi.total - s.lo.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>How this works and its limits</h2>
        <ul className="src-list" style={{ paddingLeft: 18 }}>
          <li>
            We tried every combination of these values:{' '}
            {LEVERS.map((l, i) => (
              <Fragment key={l.key}>{i ? (i === LEVERS.length - 1 ? ' and ' : ', ') : ''}{TESTED[l.key](show(l.key, l.grid[0]), show(l.key, l.grid[l.grid.length - 1]))}</Fragment>
            ))}. That makes {fmt(ens.runs.length)} combinations in all. For each one, we worked out the devices in place and
            the devices in use each year.
          </li>
          <li>
            The top values for the three scenarios are {listAnd(LEVERS.map((l) => AT[l.key](show(l.key, l.hi))))}. The values
            we tried go past these top values, to show what it would take to go further. By {endYear}, {fmt(reached)} combinations
            reach the public need.{' '}
            {reachedWithin === 0
              ? 'None of them stays within the top values.'
              : <>Only {fmt(reachedWithin)} of them stay{reachedWithin === 1 ? 's' : ''} within the top values. The rest push at least one factor further.</>}
          </li>
          <li>Every combination counts equally. So "8 in 10 combinations" shows the spread of the values we tried. It does not show how likely each outcome is.</li>
          <li>The forecast starts from today's guidelines-based requirement of {fmt(today.total)} devices in place. It grows the SNCU network at the chosen rate. New CPAP at NBSUs, MNCUs and in transport is added evenly each year from now to {endYear}.</li>
          <li>An MNCU (mother-newborn care unit) is a newborn unit where the mother stays with her sick baby. The FBNC 2025 guidelines place MNCUs at district hospitals and medical colleges, so the forecast counts the {fmt(base.mncuSites)} district hospitals and medical colleges in the Epidemiological Need tab as eligible. Sub-district hospitals with more than 3,000 deliveries a year can also have one, but there is no national count of them, so they are left out. Each eligible hospital gets at most one MNCU. FBNC 2025 suggests 4 CPAP for a 12-bed MNCU (Table 14), so the three scenarios use 4. The simulation also tries 2 and 6, for smaller and bigger units. Very few MNCUs are open today, so the forecast starts from none. MNCU CPAP is counted on top of SNCU CPAP. If MNCUs replace SNCU beds instead of adding to them, the total is a little too high.</li>
          <li>CPAP in transport is one CPAP in each equipped ALS (advanced life support) ambulance, for moving sick newborns between facilities. There are {fmt(base.alsAmbulances)} ALS ambulances under NHM ({ALS_SOURCE}). The {fmt(BLS_AMBULANCES)} basic life support ambulances are not counted, because national guidance gives the newborn ventilator, which can give CPAP, to ALS ambulances only. Some ALS ambulances may already carry one, but there is no national count, so the forecast starts from none.</li>
          <li>
            Utilisation is the share of devices that are actually working and in use. It depends on staff training and motivation;
            procurement of devices, consumables and spare parts; repairs and maintenance; the price of commodities; and
            upcoming innovations. We assume about {UTIL_NOW}% today. This is a planning assumption. One study found that only
            about 37% of district hospitals actually used their CPAP (Dewez et al., BMJ Open 2020). Utilisation moves evenly
            from today's level to the chosen level by {endYear}.
          </li>
          <li>The public need of {fmt(ceiling)} devices is the facility-based epidemiological need for public facilities. It comes from the Epidemiological Need tab. We compare it with devices in use, because a device that is not in use does not treat a baby. If you change the need in that tab, this tab updates too.</li>
          {acc.years[horizon].sncu > hospitals && (
            <li>
              Accelerated needs {fmt(acc.years[horizon].sncu)} SNCUs by {endYear}. That is more than the {fmt(hospitals)} public
              hospitals (district hospitals, medical colleges and sub-district hospitals) that could host one.
              {chcShare > 0.2 && <> This happens because about {Math.round(chcShare * 100)}% of the need is at CHCs. The only factor that adds CPAP below the SNCU level is CPAP at the {fmt(base.nbsu)} NBSUs, so SNCU growth has to do most of the work.</>}
            </li>
          )}
          <li>
            Device lifespan and unit price only affect how many devices to buy and what they cost, so they are not part of the
            simulation. We assume devices last {starters[0].params.replacementYears} years and each costs ₹{starters[0].params.unitPriceLakh} lakh.
          </li>
          <li>Growth rates, prices and policy coverage are planning assumptions, not official targets.</li>
        </ul>
      </div>
    </div>
  )
}
