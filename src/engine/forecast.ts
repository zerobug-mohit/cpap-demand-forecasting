// Forecast engine: projects the three trajectories (existing / epidemiological / normative)
// from the current base-year estimates, each by its own driver. Pure logic.
//
//   existing_s(y)      = existing_base_s      × (1 + g_sncu_s)^t
//   normative_s(y)     = normative_base_s     × birthsFactor_s(y)
//   epidemiological_s(y) = epi_base_s × birthsFactor_s(y) × idrFactor_s(y) × rdsFactor(y)
//
// birthsFactor uses the NCP published projection series (index vs base year); idrFactor
// trends the institutional-delivery rate by its NFHS-4→5 CAGR (capped); rdsFactor is a
// national annual change (0 = held constant). National = sum of states.
import type { Norms } from './method1'
import { computeAll } from './method1'
import type { M2Norms } from './method2'
import { computeAll2 } from './method2'
import { STATES } from '../data/states'
import { STATES2, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE } from '../data/states2'

export interface GrowthData {
  /** state-specific SNCU CAGR (fraction/yr); states missing here fall back to nationalSncuCagr. */
  sncuCagr: Record<string, number>
  nationalSncuCagr: number
  /** institutional-delivery-rate CAGR (fraction/yr) from NFHS-4 → NFHS-5, per state. */
  idrCagr: Record<string, number>
  /** projected live-births CAGR (fraction/yr) from NCP projections; states missing fall back to national. */
  birthsCagr: Record<string, number>
  nationalBirthsCagr: number
}

export interface ForecastParams {
  baseYear: number
  years: number[]
  rdsAnnualChange: number // fraction/yr; 0 = hold RDS constant
  applyIdrTrend: boolean
  idrCap: number // fraction, e.g. 1.0
  sncuRateOverride: number | null // if set, applied to all states instead of data
}

export interface YearPoint {
  year: number
  existing: number
  epidemiological: number
  normative: number
}

export interface ForecastResult {
  national: YearPoint[]
  byState: Record<string, YearPoint[]>
  /** effective SNCU growth used (national), for display. */
  sncuGrowthUsed: number
}

export const DEFAULT_FORECAST: Omit<ForecastParams, 'years' | 'baseYear'> = {
  rdsAnnualChange: 0,
  applyIdrTrend: true,
  idrCap: 1.0,
  sncuRateOverride: null,
}

export function computeForecast(m1: Norms, m2: M2Norms, g: GrowthData, p: ForecastParams): ForecastResult {
  const base1 = new Map(computeAll(STATES, m1, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE).rows.map((r) => [r.state, r]))
  const base2 = new Map(computeAll2(STATES2, m2).rows.map((r) => [r.state, r]))
  const idrBase = new Map(STATES2.map((s) => [s.state, s.idr]))

  const byState: Record<string, YearPoint[]> = {}
  const nationalMap = new Map<number, YearPoint>(p.years.map((y) => [y, { year: y, existing: 0, epidemiological: 0, normative: 0 }]))

  for (const s of STATES) {
    const b1 = base1.get(s.state)
    const b2 = base2.get(s.state)
    if (!b1 || !b2) continue
    const gS = p.sncuRateOverride ?? g.sncuCagr[s.state] ?? g.nationalSncuCagr
    const idrC = g.idrCagr[s.state] ?? 0
    const birthsC = g.birthsCagr[s.state] ?? g.nationalBirthsCagr
    const idr0 = idrBase.get(s.state) ?? 1
    const series: YearPoint[] = []

    for (const y of p.years) {
      const t = y - p.baseYear
      const birthsF = Math.pow(1 + birthsC, t)
      const idrF = p.applyIdrTrend && idr0 > 0 ? Math.min(p.idrCap, idr0 * Math.pow(1 + idrC, t)) / idr0 : 1
      const rdsF = Math.pow(1 + p.rdsAnnualChange, t)

      const existing = b1.asisCpap * Math.pow(1 + gS, t)
      const normative = b1.normCpap * birthsF
      const epidemiological = b2.gross * birthsF * idrF * rdsF

      series.push({ year: y, existing, epidemiological, normative })
      const nat = nationalMap.get(y)!
      nat.existing += existing
      nat.epidemiological += epidemiological
      nat.normative += normative
    }
    byState[s.state] = series
  }

  const national = p.years.map((y) => {
    const n = nationalMap.get(y)!
    return { year: y, existing: Math.round(n.existing), epidemiological: Math.round(n.epidemiological), normative: Math.round(n.normative) }
  })

  return { national, byState, sncuGrowthUsed: p.sncuRateOverride ?? g.nationalSncuCagr }
}
