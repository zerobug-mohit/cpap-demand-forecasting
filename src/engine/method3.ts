// Pure calculation engine for the facility-based CPAP NEED cascade ("Cascade B").
// Epidemiological sub-approach: instead of anchoring to a clinical RDS rate, it sizes
// devices from the deliveries the PUBLIC facility network conducts (District Hospitals,
// Medical Colleges, Sub-District Hospitals, CHCs), applying an editable FBNC-consistent
// norm (beds per 1,000 deliveries × CPAP per bed). Private-sector facilities are estimated
// separately on their own tab (see engine/methodPrivate.ts). No React.

export type Burden = 'high' | 'med' | 'low'

export interface FacilityLevel {
  key: string
  name: string
  count: number
  tiers: Record<Burden, number> // % split across burden tiers (sum = 100)
  beds: number // SNCU beds per 1,000 deliveries
  cpapPerBed: number // CPAP devices per bed
  fbnc: boolean // default follows the FBNC guideline (tag only)
  lock: boolean // DH / Medical Colleges are held at 100% High regardless of caseload
  floorOne: boolean // at least one CPAP per facility (SDH/CHC): tier devices = max(facilities, FBNC-norm devices)
  inc: boolean // included in the total
}

export interface M3Norms {
  levels: FacilityLevel[]
  avg: Record<Burden, number> // average annual deliveries per facility, by burden tier
}

// Burden cutoffs (annual deliveries): High > 3,000 · Medium 1,000–3,000 · Low < 1,000 (FBNC).
export const DEFAULT_M3: M3Norms = {
  levels: [
    { key: 'dh', name: 'District Hospitals', count: 714, tiers: { high: 100, med: 0, low: 0 }, beds: 4, cpapPerBed: 0.3, fbnc: true, lock: true, floorOne: false, inc: true },
    { key: 'mc', name: 'Medical Colleges (govt)', count: 362, tiers: { high: 100, med: 0, low: 0 }, beds: 4, cpapPerBed: 0.3, fbnc: true, lock: true, floorOne: false, inc: true },
    { key: 'sdh', name: 'Sub-District Hospitals', count: 1340, tiers: { high: 30, med: 50, low: 20 }, beds: 4, cpapPerBed: 0.3, fbnc: false, lock: false, floorOne: true, inc: true },
    { key: 'chc', name: 'Community Health Centres', count: 6359, tiers: { high: 5, med: 15, low: 80 }, beds: 4, cpapPerBed: 0.3, fbnc: false, lock: false, floorOne: true, inc: true },
  ],
  avg: { high: 5000, med: 2000, low: 500 },
}

export const BURDEN_LABEL: Record<Burden, string> = {
  high: 'High >3k/yr',
  med: 'Medium 1–3k',
  low: 'Low <1k',
}

export interface TierRow {
  label: string
  facilities: number
  deliveries: number
  mid: string // norm (beds × cpapPerBed)
  devices: number
  floored: boolean // true when the "≥1 per facility" floor overrode the delivery-based norm
}

export interface Section {
  key: string
  name: string
  fbnc?: boolean
  excluded?: boolean
  facilities: number
  deliveries: number
  devices: number
  midHead: string
  tiers: TierRow[]
}

export interface Totals3 {
  devices: number
  deliveries: number
  facilities: number
}

export interface Computed3 {
  sections: Section[]
  totals: Totals3
  bars: { name: string; devices: number }[]
  maxBar: number
}

const r = (n: number) => Math.round(n)

export function computeM3(state: M3Norms): Computed3 {
  const sections: Section[] = []
  const bars: { name: string; devices: number }[] = []
  let tDel = 0
  let tDev = 0
  let tFac = 0

  for (const l of state.levels) {
    if (!l.inc) {
      sections.push({ key: l.key, name: l.name, excluded: true, facilities: l.count, deliveries: 0, devices: 0, midHead: 'Norm', tiers: [], fbnc: l.fbnc })
      continue
    }
    const facs: Record<Burden, number> = {
      high: r(l.count * l.tiers.high / 100),
      med: r(l.count * l.tiers.med / 100),
      low: 0,
    }
    facs.low = Math.max(0, l.count - facs.high - facs.med)
    const norm = l.beds * l.cpapPerBed
    const tiers: TierRow[] = []
    let lDel = 0
    let lDev = 0
    let lFac = 0
    for (const tier of ['high', 'med', 'low'] as Burden[]) {
      const f = facs[tier]
      if (!f) continue
      const del = f * state.avg[tier]
      const normDev = del * (norm / 1000)
      // SDH/CHC: at least one CPAP per facility → take the greater of facility count and norm devices.
      const floored = l.floorOne && f > normDev
      const dev = floored ? f : normDev
      tiers.push({ label: BURDEN_LABEL[tier], facilities: f, deliveries: del, mid: norm.toFixed(2), devices: dev, floored })
      lDel += del
      lDev += dev
      lFac += f
    }
    sections.push({ key: l.key, name: l.name, fbnc: l.fbnc, facilities: lFac, deliveries: lDel, devices: lDev, midHead: 'Norm', tiers })
    bars.push({ name: l.name, devices: lDev })
    tDel += lDel
    tDev += lDev
    tFac += lFac
  }

  return {
    sections,
    totals: { devices: tDev, deliveries: tDel, facilities: tFac },
    bars,
    maxBar: Math.max(1, ...bars.map((b) => b.devices)),
  }
}
