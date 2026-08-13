// Pure calculation engine for Method 1 (bottom-up, facility & norms based).
// No React dependency — mirrors the OxyCost/NFHS-Atlas engine/UI separation.
import type { StateRow } from '../data/states'

/** How wide to draw the CPAP scope. SNCU is always in; NBSU and Transport are optional what-ifs. */
export type Scope = 'sncu' | 'sncu_nbsu' | 'sncu_nbsu_transport'

export const SCOPE_LABEL: Record<Scope, string> = {
  sncu: 'SNCUs only',
  sncu_nbsu: 'SNCUs + NBSUs',
  sncu_nbsu_transport: 'SNCUs + NBSUs + Transport',
}

export const hasNbsu = (n: Norms) => n.scope !== 'sncu'
export const hasTransport = (n: Norms) => n.scope === 'sncu_nbsu_transport'

/** Optional CPAP extension for the NBSU tier — a "what-if" beyond FBNC. */
export interface FacilityExt {
  pct: number // fraction of facilities (0..1) assumed to carry CPAP
  bedsPerFacility: number
  cpapPerBed: number
}

/** Transport / portable CPAP for inter-facility neonatal transfer (proxied by facility counts). */
export interface TransportExt {
  perSncu: number // transport CPAP units per SNCU (referral hub)
  perNbsu: number // transport CPAP units per NBSU (referring unit)
}

export interface StateOverride {
  nbsuPct?: number
}

export interface Norms {
  scope: Scope
  /** CPAP devices per SNCU bed. FBNC 2025: ~30% of SNCU beds. */
  cpapPerBed: number
  /** Avg beds per SNCU unit — used to derive beds where per-state beds are unpublished. */
  avgSncuBeds: number
  /** Normative SNCU beds per 1,000 live births (FBNC-consistent: 12 beds / 3,000 = 4). */
  normBedsPer1000: number
  /** Facility scope: restrict normative sizing to public (NHM) institutional births. */
  publicOnly: boolean
  publicShareOverride: number | null // null = per-state NFHS share; else one fraction for all states
  nbsu: FacilityExt
  transport: TransportExt
  /** Per-state NBSU percentage overrides (fraction 0..1). */
  overrides: Record<string, StateOverride>
}

export const DEFAULT_NORMS: Norms = {
  scope: 'sncu',
  cpapPerBed: 0.30,
  avgSncuBeds: 16,
  normBedsPer1000: 4,
  publicOnly: true,
  publicShareOverride: null,
  nbsu: { pct: 0.25, bedsPerFacility: 4, cpapPerBed: 0.30 },
  transport: { perSncu: 1, perNbsu: 0 },
  overrides: {},
}

export type Lens = 'asis' | 'normative'

export interface ComputedRow extends StateRow {
  instBirths: number // live births × institutional-delivery rate
  pubInstBirths: number // institutional births × public-facility share (= instBirths when publicOnly off)
  asisBeds: number
  asisSncuCpap: number
  normBeds: number
  normSncuCpap: number
  nbsuCpap: number
  transportCpap: number
  extraCpap: number
  asisCpap: number // SNCU as-is + add-ons
  normCpap: number // SNCU normative + add-ons
  bedGap: number
  cpapGap: number // gap-1: normative − guidelines-based (build-out gap)
  gapGuidInstalled?: number // gap-2: guidelines-based − installed (undefined if no installed count)
  gapNormInstalled?: number // gap-3: normative − installed
  coverage: number
}

export interface Totals {
  sncu: number
  nbsu: number
  nbcc: number
  births: number
  instBirths: number
  pubInstBirths: number
  asisBeds: number
  asisSncuCpap: number
  normBeds: number
  normSncuCpap: number
  nbsuCpap: number
  transportCpap: number
  extraCpap: number
  asisCpap: number
  normCpap: number
  bedGap: number
  cpapGap: number
  coverage: number
}

const extCpap = (count: number, pct: number, f: FacilityExt) =>
  Math.round(count * pct * f.bedsPerFacility * f.cpapPerBed)

export function computeRow(s: StateRow, n: Norms, idr = 1, pubFactor = 1): ComputedRow {
  const instBirths = Math.round(s.births * idr)
  const pubInstBirths = Math.round(instBirths * pubFactor)
  const asisBeds = Math.round(s.sncu * n.avgSncuBeds)
  const asisSncuCpap = Math.round(asisBeds * n.cpapPerBed)
  // Normative build-out sizes beds from PUBLIC institutional births (births × IDR × public share).
  const normBeds = Math.round((pubInstBirths / 1000) * n.normBedsPer1000)
  const normSncuCpap = Math.round(normBeds * n.cpapPerBed)

  const ov = n.overrides[s.state] ?? {}
  const nbsuPct = hasNbsu(n) ? ov.nbsuPct ?? n.nbsu.pct : 0
  const nbsuCpap = hasNbsu(n) ? extCpap(s.nbsu, nbsuPct, n.nbsu) : 0
  const transportCpap = hasTransport(n)
    ? Math.round(s.sncu * n.transport.perSncu + s.nbsu * n.transport.perNbsu)
    : 0
  const extraCpap = nbsuCpap + transportCpap

  const asisCpap = asisSncuCpap + extraCpap
  const normCpap = normSncuCpap + extraCpap

  return {
    ...s,
    instBirths,
    pubInstBirths,
    asisBeds,
    asisSncuCpap,
    normBeds,
    normSncuCpap,
    nbsuCpap,
    transportCpap,
    extraCpap,
    asisCpap,
    normCpap,
    bedGap: normBeds - asisBeds,
    cpapGap: normCpap - asisCpap,
    gapGuidInstalled: s.installed != null ? asisCpap - s.installed : undefined,
    gapNormInstalled: s.installed != null ? normCpap - s.installed : undefined,
    coverage: normCpap > 0 ? asisCpap / normCpap : 0,
  }
}

export function computeAll(states: StateRow[], n: Norms, idrByState?: Record<string, number>, publicShareByState?: Record<string, number>): { rows: ComputedRow[]; totals: Totals } {
  const pubFactorOf = (state: string) => (n.publicOnly ? (n.publicShareOverride ?? publicShareByState?.[state] ?? 1) : 1)
  const rows = states.map((s) => computeRow(s, n, idrByState?.[s.state] ?? 1, pubFactorOf(s.state)))
  const sum = (f: (r: ComputedRow) => number) => rows.reduce((a, r) => a + f(r), 0)
  const asisCpap = sum((r) => r.asisCpap)
  const normCpap = sum((r) => r.normCpap)
  const totals: Totals = {
    sncu: sum((r) => r.sncu),
    nbsu: sum((r) => r.nbsu),
    nbcc: sum((r) => r.nbcc),
    births: sum((r) => r.births),
    instBirths: sum((r) => r.instBirths),
    pubInstBirths: sum((r) => r.pubInstBirths),
    asisBeds: sum((r) => r.asisBeds),
    asisSncuCpap: sum((r) => r.asisSncuCpap),
    normBeds: sum((r) => r.normBeds),
    normSncuCpap: sum((r) => r.normSncuCpap),
    nbsuCpap: sum((r) => r.nbsuCpap),
    transportCpap: sum((r) => r.transportCpap),
    extraCpap: sum((r) => r.extraCpap),
    asisCpap,
    normCpap,
    bedGap: sum((r) => r.bedGap),
    cpapGap: sum((r) => r.cpapGap),
    coverage: normCpap > 0 ? asisCpap / normCpap : 0,
  }
  return { rows, totals }
}

export const lensCpap = (r: ComputedRow, lens: Lens) => (lens === 'asis' ? r.asisCpap : r.normCpap)
