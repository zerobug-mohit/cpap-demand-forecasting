import type { ComputedRow } from './method1'
import type { MetricKind } from './metrics2'

export interface Metric {
  key: string
  label: string
  get: (r: ComputedRow) => number
  kind: MetricKind
}

export const METRICS: Metric[] = [
  { key: 'sncu', label: 'SNCUs (units)', get: (r) => r.sncu, kind: 'int' },
  { key: 'nbsu', label: 'NBSUs (units)', get: (r) => r.nbsu, kind: 'int' },
  { key: 'asisCpap', label: 'CPAP devices needed (current demand)', get: (r) => r.asisCpap, kind: 'int' },
  { key: 'gapGuidInstalled', label: 'Gap: current demand − installed', get: (r) => r.gapGuidInstalled ?? NaN, kind: 'int' },
  { key: 'births', label: 'Live births (latest estimate)', get: (r) => r.births, kind: 'int' },
  { key: 'instBirths', label: 'Births in facilities (est.)', get: (r) => r.instBirths, kind: 'int' },
  { key: 'instDelivRate', label: 'Share of births in facilities', get: (r) => (r.births > 0 ? (r.instBirths / r.births) * 100 : NaN), kind: 'pct' },
  { key: 'installed', label: 'CPAP installed · actual (some states)', get: (r) => r.installed ?? NaN, kind: 'int' },
]

export const getMetric = (key: string) => METRICS.find((m) => m.key === key) ?? METRICS[0]
