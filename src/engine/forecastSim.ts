// Scenario simulation for the Forecasting tab. Runs the forecast engine (methodForecast.ts)
// across many combinations of seven levers — six that set how many devices are IN PLACE, plus
// utilisation, which sets how many of them are actually IN USE — to show the spread of possible
// paths, and derives the three starter scenarios from one "ambition" dial that moves every lever
// together from today's status quo (0) towards its stretch value (1):
//   Baseline    — ambition 0: SNCUs keep growing at the historical rate, no new policy,
//                 utilisation stays where it is today
//   Moderate    — just enough ambition to close half the gap between Baseline and the ceiling
//   Accelerated — just enough ambition for devices IN USE to reach the ceiling (the public
//                 facility-based epidemiological need) by the end of the horizon
// Device lifespan and unit price only set procurement and cost, so they are not simulated;
// each starter keeps its scenario's values for them. No React.

import { computeForecast, demandAt, scenarioParams, utilisationAt } from './methodForecast'
import type { ForecastBase, ForecastParams, ForecastYear } from './methodForecast'
import { MNCU_LEVER, CPAP_PER_MNCU_LEVER, ALS_LEVER } from '../data/forecastInputs'

export type LeverKey = 'sncuGrowthPct' | 'nbsuCpapSharePct' | 'cpapPerNbsu' | 'mncuSharePct' | 'cpapPerMncu' | 'alsCpapSharePct' | 'utilisationPct'
export type LeverValues = Record<LeverKey, number>

export interface Lever {
  key: LeverKey
  label: string
  lo: number // status quo — today's path with no policy change
  hi: number // stretch — the most ambitious value the three scenarios are built from
  max: number // hard limit the ambition dial can never push past (e.g. 100% of NBSUs)
  step: number // rounding step for a starter scenario's value (matches the UI control)
  grid: number[] // values tried in the simulation — reaches past the stretch, to show what that would take
}

export const LEVERS: Lever[] = [
  { key: 'sncuGrowthPct', label: 'SNCU / NICU growth per year (%)', lo: 6.6, hi: 12, max: 30, step: 0.1, grid: [4, 5, 6, 6.6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { key: 'nbsuCpapSharePct', label: 'NBSUs with CPAP by the end (%)', lo: 0, hi: 100, max: 100, step: 5, grid: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
  { key: 'cpapPerNbsu', label: 'CPAP per equipped NBSU', lo: 1, hi: 2, max: 4, step: 0.5, grid: [1, 1.5, 2, 2.5, 3] },
  // One MNCU per eligible facility (tiers and count: src/data/forecastInputs.ts); share reached by the end.
  { key: 'mncuSharePct', label: 'Eligible facilities with an MNCU by the end (%)', lo: MNCU_LEVER.lo, hi: MNCU_LEVER.hi, max: 100, step: 5, grid: MNCU_LEVER.grid },
  { key: 'cpapPerMncu', label: 'CPAP per MNCU', lo: CPAP_PER_MNCU_LEVER.lo, hi: CPAP_PER_MNCU_LEVER.hi, max: 8, step: 1, grid: CPAP_PER_MNCU_LEVER.grid },
  // One CPAP per equipped ALS ambulance (fleet size: src/data/forecastInputs.ts); share reached by the end.
  { key: 'alsCpapSharePct', label: 'CPAP in transport: ALS ambulances with a CPAP by the end (%)', lo: ALS_LEVER.lo, hi: ALS_LEVER.hi, max: 100, step: 5, grid: ALS_LEVER.grid },
  // Share of devices working and in use by the end (staff training and motivation; procurement of devices,
  // consumables and spares; repairs and maintenance; commodity prices; upcoming innovations).
  // ~60% today is the baseline assumption (Dewez 2020: only ~37% of DHs actually used CPAP).
  { key: 'utilisationPct', label: 'Devices in use by the end (%)', lo: 60, hi: 90, max: 100, step: 5, grid: [40, 50, 60, 70, 80, 85, 90, 95] },
]
const UTIL = LEVERS.find((l) => l.key === 'utilisationPct')!

/** Lever values → full forecast params, on top of a scenario's lifespan and price. */
export function leverParams(v: LeverValues, horizon: number, rest: ForecastParams): ForecastParams {
  return {
    ...rest,
    horizon,
    sncuGrowthPct: v.sncuGrowthPct,
    nbsuCpapSharePct: v.nbsuCpapSharePct,
    cpapPerNbsu: v.cpapPerNbsu,
    mncuSharePct: v.mncuSharePct,
    cpapPerMncu: v.cpapPerMncu,
    alsCpapSharePct: v.alsCpapSharePct,
    utilisationPct: v.utilisationPct,
    utilisationNowPct: UTIL.lo,
  }
}

/** Project one combination of lever values (devices in place, in use, procurement and cost). */
export function projectLevers(base: ForecastBase, levers: LeverValues, horizon: number): ForecastYear[] {
  return computeForecast(base, leverParams(levers, horizon, scenarioParams('s1')))
}

/** Every lever the same fraction `a` of the way from status quo to stretch (a > 1 extrapolates). */
export function atAmbition(a: number): LeverValues {
  return Object.fromEntries(LEVERS.map((l) => [l.key, Math.min(l.max, l.lo + a * (l.hi - l.lo))])) as LeverValues
}

const endInUse = (base: ForecastBase, p: ForecastParams) => demandAt(base, p, p.horizon).total * utilisationAt(p, p.horizon)

// Bisection on an increasing function: the smallest x in [lo, hi] with f(x) ≥ target.
function solveUp(f: (x: number) => number, target: number, lo: number, hi: number): number {
  if (f(hi) < target) return hi
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) >= target) hi = mid
    else lo = mid
  }
  return hi
}

// The k-th smallest value (0-based), partially reordering `a` in place (quickselect) — much
// cheaper than a full sort when only a few percentiles of ~30,000 values are needed.
function select(a: Float64Array, k: number): number {
  let lo = 0
  let hi = a.length - 1
  while (hi > lo) {
    const pivot = a[(lo + hi) >> 1]
    let i = lo
    let j = hi
    while (i <= j) {
      while (a[i] < pivot) i++
      while (a[j] > pivot) j--
      if (i <= j) { const tmp = a[i]; a[i] = a[j]; a[j] = tmp; i++; j-- }
    }
    if (k <= j) hi = j
    else if (k >= i) lo = i
    else return a[k]
  }
  return a[k]
}

// Percentile q (0–1) with linear interpolation between neighbouring values. After select() puts the
// lo-th value in place, everything to its right is at least as big, so the next value is just their minimum.
function quantile(a: Float64Array, q: number): number {
  const i = (a.length - 1) * q
  const lo = Math.floor(i)
  const v = select(a, lo)
  if (i === lo) return v
  let next = Infinity
  for (let k = lo + 1; k < a.length; k++) if (a[k] < next) next = a[k]
  return v + (next - v) * (i - lo)
}

function minMax(a: Float64Array): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (let k = 0; k < a.length; k++) { const v = a[k]; if (v < min) min = v; if (v > max) max = v }
  return [min, max]
}

// ---------------- the simulation (every combination of the lever grids) ----------------

export interface SimRun {
  levers: LeverValues
  inPlace: number[] // devices in place, year 0 … horizon (shared by runs that differ only in utilisation)
  use: number[] // share of devices in use each year, 0–1 (shared by runs with the same utilisation)
  end: number // devices in use at the end of the horizon
  reachYear: number | null // first year devices in use reach the ceiling, or null if they never do
}

/** Devices in use in year t for one run. */
export const inUseAt = (r: SimRun, t: number) => r.inPlace[t] * r.use[t]

export interface Band {
  year: number
  min: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  max: number
}

export interface Ensemble {
  runs: SimRun[]
  bands: Band[] // spread of devices in use across all runs, per year
  reachShare: number // share of runs whose devices in use reach the ceiling by the end of the horizon
  slots: Uint8Array // run i's position in lever L's grid is slots[i * LEVERS.length + L] (for leverEffects)
}

export function simulate(base: ForecastBase, horizon: number, ceiling: number): Ensemble {
  let combos: LeverValues[] = [{} as LeverValues]
  for (const l of LEVERS) if (l !== UTIL) combos = combos.flatMap((c) => l.grid.map((v) => ({ ...c, [l.key]: v })))

  // Utilisation doesn't change the devices in place, so each combination of the other levers is
  // projected once and then scaled by every tested utilisation (its yearly path computed once).
  const rest = scenarioParams('s1')
  const p0 = leverParams({ ...combos[0], utilisationPct: UTIL.lo }, horizon, rest)
  const usePath = UTIL.grid.map((u) => Array.from({ length: horizon + 1 }, (_, t) => utilisationAt({ ...p0, utilisationPct: u }, t)))
  const NL = LEVERS.length
  const U = UTIL.grid.length
  const uSlot = LEVERS.indexOf(UTIL)
  const gridSlot = LEVERS.map((l) => new Map(l.grid.map((v, k) => [v, k])))
  const runs: SimRun[] = []
  const inPlaces: number[][] = [] // one per combination, shared by its U runs
  const slots = new Uint8Array(combos.length * U * NL)
  for (const c of combos) {
    const p = leverParams({ ...c, utilisationPct: UTIL.lo }, horizon, rest)
    const inPlace = Array.from({ length: horizon + 1 }, (_, t) => demandAt(base, p, t).total)
    inPlaces.push(inPlace)
    const cSlot = LEVERS.map((l, i) => (i === uSlot ? 0 : gridSlot[i].get(c[l.key])!))
    UTIL.grid.forEach((u, j) => {
      const use = usePath[j]
      let hit = -1
      for (let t = 0; t <= horizon; t++) if (inPlace[t] * use[t] >= ceiling) { hit = t; break }
      const at = runs.length * NL
      for (let i = 0; i < NL; i++) slots[at + i] = i === uSlot ? j : cSlot[i]
      runs.push({ levers: { ...c, utilisationPct: u }, inPlace, use, end: inPlace[horizon] * use[horizon], reachYear: hit < 0 ? null : hit })
    })
  }

  // Devices in use for every run in year t, in run order (combination by combination, then utilisation),
  // read from the shared paths rather than from each run object — much faster over ~250,000 runs.
  const col = new Float64Array(runs.length)
  const bands = Array.from({ length: horizon + 1 }, (_, t) => {
    let k = 0
    for (const ip of inPlaces) { const v = ip[t]; for (let j = 0; j < U; j++) col[k++] = v * usePath[j][t] }
    const [min, max] = minMax(col)
    return { year: t, min, p10: quantile(col, 0.1), p25: quantile(col, 0.25), p50: quantile(col, 0.5), p75: quantile(col, 0.75), p90: quantile(col, 0.9), max }
  })

  return { runs, bands, reachShare: runs.filter((r) => r.reachYear !== null).length / runs.length, slots }
}

export interface LeverEffect {
  lever: Lever
  means: { value: number; total: number }[] // average end-year devices in use at each tested value of this lever
}

/** How much each lever moves end-year devices in use: the average over every combination of the other levers. */
export function leverEffects(ens: Ensemble): LeverEffect[] {
  // One pass over the runs, summing end-year devices in use by (lever, tested value).
  const NL = LEVERS.length
  const total = LEVERS.map((l) => new Float64Array(l.grid.length))
  const count = LEVERS.map((l) => new Float64Array(l.grid.length))
  for (let r = 0; r < ens.runs.length; r++) {
    const end = ens.runs[r].end
    for (let i = 0; i < NL; i++) {
      const k = ens.slots[r * NL + i]
      total[i][k] += end
      count[i][k] += 1
    }
  }
  return LEVERS.map((lever, i) => ({
    lever,
    means: lever.grid.map((value, k) => ({ value, total: total[i][k] / count[i][k] })),
  }))
}

// ---------------- the three starter scenarios ----------------

export interface Starter {
  key: string // matches the SCENARIOS key it seeds (s1 / s2 / s3)
  tag: string
  target: number // end-of-horizon devices in use the starter was solved to reach
  ambition: number // 0 = status quo, 1 = every lever at its stretch value
  levers: LeverValues // rounded to the UI steps
  params: ForecastParams
  years: ForecastYear[]
}

export function deriveStarters(base: ForecastBase, horizon: number, ceiling: number): Starter[] {
  const make = (key: string, tag: string, target: number | null): Starter => {
    const rest = scenarioParams(key)
    const end = (v: LeverValues) => endInUse(base, leverParams(v, horizon, rest))

    let a = 0
    if (target !== null) {
      let aHi = 1
      while (end(atAmbition(aHi)) < target && aHi < 10) aHi *= 2
      a = solveUp((x) => end(atAmbition(x)), target, 0, aHi)
    }

    // Round every lever to its UI step, then re-solve growth (the finest lever) so the
    // rounded scenario still lands on — or just above — its target.
    const levers = Object.fromEntries(LEVERS.map((l) => [l.key, +(Math.round(atAmbition(a)[l.key] / l.step) * l.step).toFixed(2)])) as LeverValues
    if (target !== null) {
      const g = solveUp((x) => end({ ...levers, sncuGrowthPct: x }), target, 0, 60)
      levers.sncuGrowthPct = Math.ceil(g * 10 - 1e-9) / 10
    }

    const params = leverParams(levers, horizon, rest)
    return { key, tag, target: target ?? 0, ambition: a, levers, params, years: computeForecast(base, params) }
  }

  const baseline = make('s1', 'Baseline', null)
  const baseEnd = baseline.years[horizon].effective
  return [
    { ...baseline, target: baseEnd },
    make('s2', 'Moderate expansion', (baseEnd + ceiling) / 2),
    make('s3', 'Accelerated', ceiling),
  ]
}
