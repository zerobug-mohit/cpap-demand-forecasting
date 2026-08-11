// Pure calculation engine for Method 2 (top-down, epidemiological).
// National eligible-case pool is anchored to the literature rate, then REDISTRIBUTED across
// states by (institutional births × risk-index^β). The index blends state LBW and NMR
// relative to their national standardizers. No React dependency.

export type M2Driver = 'composite' | 'lbw' | 'volume'

export interface State2 {
  state: string
  ut?: boolean
  births: number // annual live births (from Method-1 data / SRS × projections)
  idr: number // institutional-delivery rate, fraction 0..1 (NFHS-5)
  lbw: number | null // low-birth-weight %, e.g. 18.2 (NFHS-5); null if unavailable
  nmr: number | null // neonatal mortality rate per 1,000 (SRS); null if unavailable
}

export interface M2Norms {
  // National eligibility anchor: E_nat (CPAP-eligible cases per institutional birth) = rdsPer1000/1000 × correction
  rdsPer1000: number // RDS cases per 1,000 institutional births (national, case-mix corrected)
  correction: number // ×factor for non-RDS conditions (TTN/MAS/sepsis/apnoea), >1
  // Care cascade tail (national constants, adjustable)
  durationDays: number
  admissionRate: number // fraction of eligible cases reaching a facility
  buffer: number // single planning buffer on mean concurrent: peak concurrency + attrition + lead-time/spares (e.g. 0.45)
  // State-variance driver
  driver: M2Driver
  wLbw: number // composite weight on LBW
  wNmr: number // composite weight on NMR
  beta: number // sensitivity: 0 = uniform per-birth rate (volume), 1 = full risk-weighting
}

export const DEFAULT_M2: M2Norms = {
  rdsPer1000: 25, // upper of India birth-denominator studies (AFMC 4.5 · NNPD 12 · AIIMS 19.1 · Aligarh 25.3). Range 4.5-25.3.
  correction: 2.0, // (% put on CPAP) ÷ (RDS share) in Indian resp-distress cohorts: Aligarh 67.5/35.5=1.90 · Navi Mumbai 68/32.8=2.07 → median ~2.0. Range 1.9-2.1.
  durationDays: 2.0, // median of Indian per-course studies (Koti 1.0 · Niveditha 1.5 · Noolu 2.3 · Tahreem 3.0 → median ~1.9). Range 1-3 d.
  admissionRate: 1.0,
  buffer: 0.3, // combined planning uplift: peak-concurrency + attrition + lead-time/spares
  driver: 'composite',
  wLbw: 0.6,
  wNmr: 0.4,
  beta: 1,
}

export interface Computed2 extends State2 {
  instBirths: number
  index: number // relative risk index (national-standardized)
  share: number // share of national eligible pool
  eligible: number // CPAP-eligible cases
  eligPer1000: number // eligible per 1,000 institutional births (implied state rate)
  reaching: number // cases reaching facility
  meanConcurrent: number
  gross: number // gross device requirement
  lbwImputed: boolean
  nmrImputed: boolean
}

export interface Totals2 {
  births: number
  instBirths: number
  eligible: number
  reaching: number
  meanConcurrent: number
  gross: number
  eligPer1000: number
}

const wmean = (vals: { v: number | null; w: number }[]) => {
  let sw = 0
  let s = 0
  for (const { v, w } of vals) {
    if (v != null) {
      s += v * w
      sw += w
    }
  }
  return sw > 0 ? s / sw : 1
}

export function computeAll2(states: State2[], n: M2Norms): { rows: Computed2[]; totals: Totals2 } {
  const inst = states.map((s) => s.births * s.idr)
  const instTotal = inst.reduce((a, b) => a + b, 0)

  // national standardizers (institutional-births-weighted state means)
  const lbwStd = wmean(states.map((s, i) => ({ v: s.lbw, w: inst[i] })))
  const nmrStd = wmean(states.map((s, i) => ({ v: s.nmr, w: inst[i] })))

  const eNat = (n.rdsPer1000 / 1000) * n.correction // eligible cases per institutional birth
  const eligiblePool = eNat * instTotal

  const wSum = n.wLbw + n.wNmr || 1
  const wl = n.wLbw / wSum
  const wn = n.wNmr / wSum

  const indexOf = (s: State2): { index: number; lbwImp: boolean; nmrImp: boolean } => {
    const lbwR = s.lbw != null ? s.lbw / lbwStd : 1
    const nmrR = s.nmr != null ? s.nmr / nmrStd : 1
    let index = 1
    if (n.driver === 'lbw') index = lbwR
    else if (n.driver === 'composite') index = wl * lbwR + wn * nmrR
    return { index, lbwImp: s.lbw == null, nmrImp: s.nmr == null }
  }

  const raw = states.map((s, i) => {
    const { index } = indexOf(s)
    const w = inst[i] * Math.pow(Math.max(index, 0), n.beta)
    return { index, w }
  })
  const rawSum = raw.reduce((a, r) => a + r.w, 0) || 1

  const rows: Computed2[] = states.map((s, i) => {
    const instBirths = inst[i]
    const { index, lbwImp, nmrImp } = indexOf(s)
    const share = raw[i].w / rawSum
    const eligible = eligiblePool * share
    const reaching = eligible * n.admissionRate
    const deviceDays = reaching * n.durationDays
    const meanConcurrent = deviceDays / 365
    const gross = Math.ceil(meanConcurrent * (1 + n.buffer))
    return {
      ...s,
      instBirths,
      index,
      share,
      eligible,
      eligPer1000: instBirths > 0 ? (eligible / instBirths) * 1000 : 0,
      reaching,
      meanConcurrent,
      gross,
      lbwImputed: lbwImp,
      nmrImputed: nmrImp,
    }
  })

  const sum = (f: (r: Computed2) => number) => rows.reduce((a, r) => a + f(r), 0)
  const eligible = sum((r) => r.eligible)
  const totals: Totals2 = {
    births: sum((r) => r.births),
    instBirths: instTotal,
    eligible,
    reaching: sum((r) => r.reaching),
    meanConcurrent: sum((r) => r.meanConcurrent),
    gross: sum((r) => r.gross),
    eligPer1000: instTotal > 0 ? (eligible / instTotal) * 1000 : 0,
  }
  return { rows, totals }
}
