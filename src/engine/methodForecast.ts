// Pure forecasting engine. Projects the number of public-sector CPAP devices REQUIRED
// over a multi-year horizon, built from configurable factors, under three scenarios.
// The scenarios are just preset factor values — everything here is editable in the UI.
// No React.

export interface ForecastBase {
  sncu: number // current SNCU / NICU count
  nbsu: number // current NBSU count
  cpapPerSncu: number // CPAP devices per SNCU = avg beds × CPAP-per-bed × (1 + buffer)
}

export interface ForecastParams {
  horizon: number // years to project (year 0 = today)
  sncuGrowthPct: number // annual % growth in the number of SNCUs / NICUs
  nbsuCpapSharePct: number // % of NBSUs equipped with CPAP by the end of the horizon (ramps up linearly)
  cpapPerNbsu: number // CPAP devices per equipped NBSU
  mncuByEnd: number // number of new MNCUs added by the end of the horizon (ramps up linearly)
  cpapPerMncu: number // CPAP devices per MNCU
  portableSharePct: number // % of SNCUs that also get a portable / transport CPAP by the end (ramps up)
  cpapPerPortable: number // devices per portable unit
  replacementYears: number // device lifespan — drives how many must be replaced each year
  utilisationPct: number // share of required devices that are actually functional / in use (training + consumables)
  unitPriceLakh: number // price per device, in ₹ lakh — drives the procurement-cost output
}

export interface ForecastYear {
  year: number // 0 = today, 1 = next year, …
  sncu: number // projected SNCU count
  sncuCore: number // devices driven by the SNCU network
  nbsu: number // devices from CPAP at NBSUs
  mncu: number // devices from new MNCUs
  portable: number // devices from portable / transport CPAP
  total: number // total devices REQUIRED (the sum of the four components)
  effective: number // total × utilisation — devices effectively in service
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
  mncuByEnd: 0,
  cpapPerMncu: 3,
  portableSharePct: 0,
  cpapPerPortable: 1,
  replacementYears: 7,
  utilisationPct: 100,
  unitPriceLakh: 1.5,
}

export const SCENARIOS: Scenario[] = [
  {
    key: 's1', name: 'Scenario 1', tag: 'Baseline', color: '#0e7e92',
    blurb: 'The system carries on as it is — SNCUs keep growing at the current rate, no policy change, no CPAP at transport or lower-level facilities.',
    params: { ...BASELINE },
  },
  {
    key: 's2', name: 'Scenario 2', tag: 'Moderate expansion', color: '#c2912a',
    blurb: 'Infrastructure grows a little faster, there is some policy change, and the busiest (high-load) NBSUs are equipped with CPAP.',
    params: { ...BASELINE, sncuGrowthPct: 8.5, nbsuCpapSharePct: 20, portableSharePct: 5 },
  },
  {
    key: 's3', name: 'Scenario 3', tag: 'Accelerated', color: '#123a5e',
    blurb: 'Infrastructure grows faster still, with broader policy change — including new MNCUs that also carry CPAP — and staffing and training are strengthened.',
    params: { ...BASELINE, sncuGrowthPct: 11, nbsuCpapSharePct: 40, mncuByEnd: 150, portableSharePct: 15 },
  },
]

export function scenarioParams(key: string): ForecastParams {
  return { ...(SCENARIOS.find((s) => s.key === key)?.params ?? BASELINE) }
}

export function computeForecast(base: ForecastBase, p: ForecastParams): ForecastYear[] {
  const years: ForecastYear[] = []
  const g = p.sncuGrowthPct / 100
  const H = Math.max(1, p.horizon)
  for (let t = 0; t <= p.horizon; t++) {
    const ramp = t / H // policy add-ons phase in linearly from 0 (today) to 1 (end of horizon)
    const sncu = base.sncu * Math.pow(1 + g, t)
    const sncuCore = sncu * base.cpapPerSncu
    const nbsu = base.nbsu * (p.nbsuCpapSharePct / 100) * ramp * p.cpapPerNbsu
    const mncu = p.mncuByEnd * ramp * p.cpapPerMncu
    const portable = sncu * (p.portableSharePct / 100) * ramp * p.cpapPerPortable
    const total = sncuCore + nbsu + mncu + portable
    const effective = total * (p.utilisationPct / 100)

    const prev = years[t - 1]
    const replacement = prev && p.replacementYears > 0 ? prev.total / p.replacementYears : 0
    const growth = prev ? Math.max(0, total - prev.total) : 0
    const added = prev ? growth + replacement : 0
    const cumAdded = (prev?.cumAdded ?? 0) + added
    const cumCostCr = (cumAdded * p.unitPriceLakh) / 100 // ₹ lakh → ₹ crore

    years.push({ year: t, sncu, sncuCore, nbsu, mncu, portable, total, effective, added, cumAdded, cumCostCr })
  }
  return years
}
