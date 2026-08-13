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
  { key: 'asisCpap', label: 'CPAP required · guidelines-based', get: (r) => r.asisCpap, kind: 'int' },
  { key: 'normCpap', label: 'CPAP required · normative', get: (r) => r.normCpap, kind: 'int' },
  { key: 'cpapGap', label: 'Build-out gap', get: (r) => r.cpapGap, kind: 'int' },
  { key: 'births', label: 'Live births (latest est.)', get: (r) => r.births, kind: 'int' },
  { key: 'instBirths', label: 'Institutional births (est.)', get: (r) => r.instBirths, kind: 'int' },
  { key: 'instDelivRate', label: 'Institutional delivery rate', get: (r) => (r.births > 0 ? (r.instBirths / r.births) * 100 : NaN), kind: 'pct' },
  { key: 'pubInstBirths', label: 'Public institutional births (est.)', get: (r) => r.pubInstBirths, kind: 'int' },
  { key: 'installed', label: 'Installed CPAP · actual (select states)', get: (r) => r.installed ?? NaN, kind: 'int' },
]

export const getMetric = (key: string) => METRICS.find((m) => m.key === key) ?? METRICS[0]
