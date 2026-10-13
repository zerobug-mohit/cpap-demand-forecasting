// Pure forecasting engine. Projects the number of public-sector CPAP devices REQUIRED
// over a multi-year horizon, built from configurable factors, under three scenarios.
// The scenarios are just preset factor values — everything here is editable in the UI.
// No React.

import { CPAP_PER_MNCU } from '../data/forecastInputs'

export interface ForecastBase {
  sncu: number // current SNCU / NICU count
  nbsu: number // current NBSU count
  cpapPerSncu: number // CPAP devices per SNCU = avg beds × CPAP-per-bed × (1 + buffer)
  mncuSites: number // public facilities eligible for a Mother-Newborn Care Unit (one MNCU each)
  alsAmbulances: number // Advanced Life Support ambulances in the public fleet (one CPAP each)
}

export interface ForecastParams {
  horizon: number // years to project (year 0 = today)
  sncuGrowthPct: number // annual % growth in the number of SNCUs / NICUs
  nbsuCpapSharePct: number // % of NBSUs equipped with CPAP by the end of the horizon (ramps up linearly)
  cpapPerNbsu: number // CPAP devices per equipped NBSU
  mncuSharePct: number // % of eligible facilities with an MNCU by the end of the horizon (ramps up linearly)
  cpapPerMncu: number // CPAP devices per MNCU
  alsCpapSharePct: number // % of ALS ambulances carrying a CPAP for newborn transfer by the end (ramps up)
  cpapPerAmbulance: number // CPAP devices per equipped ambulance
  replacementYears: number // device lifespan — drives how many must be replaced each year
  utilisationPct: number // share of devices in place that are working and in use by the end of the horizon (staff training and motivation, procurement, repairs and maintenance, commodity prices, innovations)
  utilisationNowPct: number // share in use today — utilisation moves evenly from this to utilisationPct
  unitPriceLakh: number // price per device, in ₹ lakh — drives the procurement-cost output
}

export interface ForecastYear {
  year: number // 0 = today, 1 = next year, …
  sncu: number // projected SNCU count
  sncuCore: number // devices driven by the SNCU network
  nbsu: number // devices from CPAP at NBSUs
  mncu: number // devices from MNCUs
  transport: number // devices carried in ALS ambulances for newborn transfer
  total: number // total devices REQUIRED (the sum of the four components)
  effective: number // total × that year's utilisation — devices actually working and in use
  added: number // new devices to procure this year (growth + replacement)
  cumAdded: number // cumulative new devices procured since today
  cumCostCr: number // cumulative procurement cost, in ₹ crore
}

export interface Scenario {
  key: string
  name: string
  tag: string
  blurb: string
  color: string
  params: ForecastParams
}

export const DEFAULT_HORIZON = 5

const BASELINE: ForecastParams = {
  horizon: DEFAULT_HORIZON,
  sncuGrowthPct: 6.6, // observed ~6.6%/yr from the published 2014–2024 SNCU counts
  nbsuCpapSharePct: 0,
  cpapPerNbsu: 1,
  mncuSharePct: 0,
  cpapPerMncu: CPAP_PER_MNCU,
  alsCpapSharePct: 0,
  cpapPerAmbulance: 1,
  replacementYears: 7,
  utilisationPct: 60, // India public-facility reality: ~37% of DHs use CPAP, half lack blenders/trained staff (Dewez 2020)
  utilisationNowPct: 60,
  unitPriceLakh: 2.5, // complete bubble-CPAP unit in recent Indian tenders (Gujarat ~2.5L, Jharkhand ~3L)
}

export const SCENARIOS: Scenario[] = [
  {
    key: 's1', name: 'Scenario 1', tag: 'Baseline', color: 'var(--s-baseline)',
    blurb: 'Continues the growth India actually achieved over 2014–2024 (about 6.6% a year), with no policy change and CPAP only where it sits today — the honest "nothing new" path.',
    params: { ...BASELINE },
  },
  {
    key: 's2', name: 'Scenario 2', tag: 'Moderate expansion', color: 'var(--s-moderate)',
    blurb: 'Matches the fastest decade India has reached (about 8.5% a year) and takes a first policy step — low-cost CPAP reaches about 1 in 5 NBSUs, with a modest lift in utilisation.',
    params: { ...BASELINE, sncuGrowthPct: 8.5, nbsuCpapSharePct: 20, alsCpapSharePct: 5, utilisationPct: 68 },
  },
  {
    key: 's3', name: 'Scenario 3', tag: 'Accelerated', color: 'var(--s-accelerated)',
    blurb: 'An above-historical, upgrade-driven push — CPAP at about 2 in 5 NBSUs plus new Mother-Newborn Care Units — that depends on funded training, consumables and maintenance raising utilisation.',
    params: { ...BASELINE, sncuGrowthPct: 10, nbsuCpapSharePct: 40, mncuSharePct: 15, alsCpapSharePct: 15, utilisationPct: 80 },
  },
]

export function scenarioParams(key: string): ForecastParams {
  return { ...(SCENARIOS.find((s) => s.key === key)?.params ?? BASELINE) }
}

/** Share of devices in use in year t (0–1): moves evenly from today's level to the end-of-horizon target. */
export function utilisationAt(p: ForecastParams, t: number): number {
  const ramp = t / Math.max(1, p.horizon)
  return (p.utilisationNowPct + (p.utilisationPct - p.utilisationNowPct) * ramp) / 100
}

/** Devices required in year t, by component — the one demand formula every projection uses. */
export function demandAt(base: ForecastBase, p: ForecastParams, t: number) {
  const ramp = t / Math.max(1, p.horizon) // policy add-ons phase in linearly from 0 (today) to 1 (end of horizon)
  const sncu = base.sncu * Math.pow(1 + p.sncuGrowthPct / 100, t)
  const sncuCore = sncu * base.cpapPerSncu
  const nbsu = base.nbsu * (p.nbsuCpapSharePct / 100) * ramp * p.cpapPerNbsu
  const mncu = base.mncuSites * (p.mncuSharePct / 100) * ramp * p.cpapPerMncu
  const transport = base.alsAmbulances * (p.alsCpapSharePct / 100) * ramp * p.cpapPerAmbulance
  return { sncu, sncuCore, nbsu, mncu, transport, total: sncuCore + nbsu + mncu + transport }
}

export function computeForecast(base: ForecastBase, p: ForecastParams): ForecastYear[] {
  const years: ForecastYear[] = []
  for (let t = 0; t <= p.horizon; t++) {
    const { sncu, sncuCore, nbsu, mncu, transport, total } = demandAt(base, p, t)
    const effective = total * utilisationAt(p, t)

    const prev = years[t - 1]
    const replacement = prev && p.replacementYears > 0 ? prev.total / p.replacementYears : 0
    const growth = prev ? Math.max(0, total - prev.total) : 0
    const added = prev ? growth + replacement : 0
    const cumAdded = (prev?.cumAdded ?? 0) + added
    const cumCostCr = (cumAdded * p.unitPriceLakh) / 100 // ₹ lakh → ₹ crore

    years.push({ year: t, sncu, sncuCore, nbsu, mncu, transport, total, effective, added, cumAdded, cumCostCr })
  }
  return years
}
