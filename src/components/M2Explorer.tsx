import { useState } from 'react'
import type { Computed2, Totals2 } from '../engine/method2'
import { METRICS2, getMetric2 } from '../engine/metrics2'
import M2Map from './M2Map'
import M2Bar from './M2Bar'
import M2Table from './M2Table'
import SourceNote from './SourceNote'
import DataCaveats from './DataCaveats'

type View = 'map' | 'visual' | 'table'

export default function M2Explorer({ rows, totals }: { rows: Computed2[]; totals: Totals2 }) {
  const [view, setView] = useState<View>('map')
  const [metricKey, setMetricKey] = useState('gross')
  const metric = getMetric2(metricKey)

  return (
    <div className="card">
      <div className="explorer-head">
        <div className="toggle-group" role="tablist" aria-label="View">
          {(['map', 'visual', 'table'] as View[]).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
              {v === 'map' ? 'Map' : v === 'visual' ? 'Visual' : 'Table'}
            </button>
          ))}
        </div>
        {view !== 'table' && (
          <div className="explorer-controls">
            <label className="ctrl-inline">
              <span className="muted">Metric</span>
              <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
                {METRICS2.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      {view === 'map' && <M2Map rows={rows} metric={metric} />}
      {view === 'visual' && <M2Bar rows={rows} metric={metric} />}
      {view === 'table' && <M2Table rows={rows} totals={totals} />}

      <hr className="divider" />
      <SourceNote refs={[{ key: 'nfhs6', page: 'inst. delivery' }, { key: 'nfhs5', page: 'LBW' }]} note="institutional delivery · LBW" />
      <SourceNote refs={[{ key: 'srs2024', page: 'NMR & CBR' }, { key: 'ncpProj', page: 'population' }]} note="NMR · live births" />
      <DataCaveats />
    </div>
  )
}
