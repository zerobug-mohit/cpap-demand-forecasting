import { useMemo } from 'react'
import { STATES } from '../data/states'
import { IDR_BY_STATE, PUBLIC_SHARE_BY_STATE } from '../data/states2'
import { computeAll, DEFAULT_NORMS, SCOPE_LABEL } from '../engine/method1'
import type { Norms } from '../engine/method1'
import { fmt } from '../utils/format'
import NormsPanel from './NormsPanel'
import LensExplainer from './LensExplainer'
import SummaryCards from './SummaryCards'
import DataExplorer from './DataExplorer'
import InsightCard from './InsightCard'
import MethodologyCard from './MethodologyCard'

interface Props {
  norms: Norms
  onChange: (n: Norms) => void
}

export default function EstimationBottomUp({ norms, onChange }: Props) {
  const { rows, totals } = useMemo(() => computeAll(STATES, norms, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE), [norms])

  return (
    <div className="layout-grid">
      <NormsPanel norms={norms} onChange={onChange} onReset={() => onChange(DEFAULT_NORMS)} />

      <div>
        <LensExplainer totals={totals} norms={norms} rows={rows} />

        {norms.scope !== 'sncu' && (
          <div className="scenario-banner">
            <strong>Scope: {SCOPE_LABEL[norms.scope]}.</strong> Add-on tiers contribute{' '}
            <strong>{fmt(totals.extraCpap)} devices</strong> beyond the current FBNC guidance.
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <SummaryCards totals={totals} />
        </div>
        <InsightCard totals={totals} />
        <DataExplorer rows={rows} totals={totals} showExt={norms.scope !== 'sncu'} />
        <MethodologyCard />
      </div>
    </div>
  )
}
