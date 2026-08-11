import { useMemo, useState } from 'react'
import { STATES } from '../data/states'
import { computeAll, DEFAULT_NORMS, SCOPE_LABEL } from '../engine/method1'
import type { Lens, Norms } from '../engine/method1'
import { fmt } from '../utils/format'
import NormsPanel from './NormsPanel'
import LensToggle from './LensToggle'
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
  const [lens, setLens] = useState<Lens>('asis')

  const { rows, totals } = useMemo(() => computeAll(STATES, norms), [norms])

  return (
    <div className="layout-grid">
      <NormsPanel norms={norms} onChange={onChange} onReset={() => onChange(DEFAULT_NORMS)} />

      <div>
        <LensExplainer totals={totals} norms={norms} />

        <div className="flex-between" style={{ marginBottom: 4 }}>
          <div className="section-label" style={{ margin: 0 }}>
            National result · choose a lens
          </div>
          <LensToggle lens={lens} onChange={setLens} />
        </div>

        {norms.scope !== 'sncu' && (
          <div className="scenario-banner">
            <strong>Scope: {SCOPE_LABEL[norms.scope]}.</strong> Add-on tiers contribute{' '}
            <strong>{fmt(totals.extraCpap)} devices</strong> to each lens (beyond current FBNC guidance).
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <SummaryCards totals={totals} lens={lens} />
        </div>
        <InsightCard totals={totals} />
        <DataExplorer rows={rows} totals={totals} showExt={norms.scope !== 'sncu'} />
        <MethodologyCard />
      </div>
    </div>
  )
}
