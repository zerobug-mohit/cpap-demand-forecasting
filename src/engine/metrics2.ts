import type { Computed2 } from './method2'
import { fmt } from '../utils/format'

export type MetricKind = 'int' | 'dec1' | 'dec2' | 'pct'

export interface Metric2 {
  key: string
  label: string
  get: (r: Computed2) => number // may be NaN where the state has no value (e.g. NMR)
  kind: MetricKind
}

export const METRICS2: Metric2[] = [
  { key: 'gross', label: 'CPAP required', get: (r) => r.gross, kind: 'int' },
  { key: 'eligible', label: 'CPAP-eligible cases', get: (r) => r.eligible, kind: 'int' },
  { key: 'eligPer1000', label: 'Eligible per 1,000 inst. births', get: (r) => r.eligPer1000, kind: 'dec1' },
  { key: 'instBirths', label: 'Institutional births', get: (r) => r.instBirths, kind: 'int' },
  { key: 'lbw', label: 'Low birth weight %', get: (r) => (r.lbw ?? NaN), kind: 'pct' },
  { key: 'nmr', label: 'Neonatal mortality rate', get: (r) => (r.nmr ?? NaN), kind: 'int' },
  { key: 'index', label: 'Risk index (state)', get: (r) => r.index, kind: 'dec2' },
]

export const getMetric2 = (key: string) => METRICS2.find((m) => m.key === key) ?? METRICS2[0]

export function fmtMetric(kind: MetricKind, v: number): string {
  if (!isFinite(v)) return 'NA'
  if (kind === 'int') return fmt(v)
  if (kind === 'dec1') return v.toFixed(1)
  if (kind === 'dec2') return v.toFixed(2)
  return `${v.toFixed(1)}%`
}
