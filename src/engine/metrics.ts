import type { ComputedRow } from './method1'

export interface Metric {
  key: string
  label: string
  get: (r: ComputedRow) => number
}

export const METRICS: Metric[] = [
  { key: 'sncu', label: 'SNCUs (units)', get: (r) => r.sncu },
  { key: 'nbsu', label: 'NBSUs (units)', get: (r) => r.nbsu },
  { key: 'asisCpap', label: 'CPAP required · existing', get: (r) => r.asisCpap },
  { key: 'normCpap', label: 'CPAP required · normative', get: (r) => r.normCpap },
  { key: 'cpapGap', label: 'Build-out gap', get: (r) => r.cpapGap },
  { key: 'births', label: 'Live births (latest est.)', get: (r) => r.births },
]

export const getMetric = (key: string) => METRICS.find((m) => m.key === key) ?? METRICS[0]
