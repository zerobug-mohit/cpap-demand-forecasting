// Joins Method-1 (bottom-up) and Method-2 (top-down) results state-by-state for the
// comparison / triangulation view. Pure logic.
import { STATES } from '../data/states'
import { STATES2, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE } from '../data/states2'
import { computeAll } from './method1'
import type { Norms } from './method1'
import { computeAll2 } from './method2'
import type { M2Norms } from './method2'

export type BuLens = 'existing' | 'normative'
export type Cls = 'under' | 'aligned' | 'over'

export interface CmpRow {
  state: string
  ut?: boolean
  births: number
  buExisting: number
  buNormative: number
  td: number
  installed?: number // actual reported CPAP devices, where available
}

export interface CmpResult {
  rows: CmpRow[]
  nat: { buExisting: number; buNormative: number; td: number }
}

export function compare(m1: Norms, m2: M2Norms): CmpResult {
  const { rows: r1, totals: t1 } = computeAll(STATES, m1, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE)
  const { rows: r2, totals: t2 } = computeAll2(STATES2, m2)
  const tdByState = new Map(r2.map((r) => [r.state, r.gross]))
  const rows: CmpRow[] = r1.map((r) => ({
    state: r.state,
    ut: r.ut,
    births: r.births,
    buExisting: r.asisCpap,
    buNormative: r.normCpap,
    td: tdByState.get(r.state) ?? 0,
    installed: r.installed,
  }))
  return { rows, nat: { buExisting: t1.asisCpap, buNormative: t1.normCpap, td: t2.gross } }
}

/** Classify a bottom-up value against the top-down clinical need. */
export function classify(bu: number, td: number): Cls {
  if (td <= 0) return 'aligned'
  const r = bu / td
  if (r < 0.67) return 'under'
  if (r > 1.5) return 'over'
  return 'aligned'
}

export const CLS_LABEL: Record<Cls, string> = {
  under: 'Under-served',
  aligned: 'Aligned',
  over: 'Potentially over-provisioned',
}
export const CLS_COLOR: Record<Cls, string> = {
  under: '#c2562b',
  aligned: '#0e7e92',
  over: '#123a5e',
}
