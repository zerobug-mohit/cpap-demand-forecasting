import { useState } from 'react'
import type { ComputedRow, Totals } from '../engine/method1'
import { METRICS, getMetric } from '../engine/metrics'
import MapView from './MapView'
import BarView from './BarView'
import type { Series } from './BarView'
import StateTable from './StateTable'
import SourceNote from './SourceNote'

type View = 'map' | 'visual' | 'table'

interface Props {
  rows: ComputedRow[]
  totals: Totals
  showExt: boolean
}

export default function DataExplorer({ rows, totals, showExt }: Props) {
  const [view, setView] = useState<View>('map')
  const [metricKey, setMetricKey] = useState('asisCpap')
  const [series, setSeries] = useState<Series>({ asis: true, norm: true, gap: false })

  const toggleSeries = (k: keyof Series) => {
    const next = { ...series, [k]: !series[k] }
    if (!next.asis && !next.norm && !next.gap) return // keep at least one
    setSeries(next)
  }

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

        <div className="explorer-controls">
          {view === 'map' && (
            <label className="ctrl-inline">
              <span className="muted">Metric</span>
              <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
                {METRICS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </label>
          )}
          {view === 'visual' && (
            <div className="series-toggle">
              <button className={series.asis ? 'on asis' : ''} onClick={() => toggleSeries('asis')}>Existing</button>
              <button className={series.norm ? 'on norm' : ''} onClick={() => toggleSeries('norm')}>Normative</button>
              <button className={series.gap ? 'on gap' : ''} onClick={() => toggleSeries('gap')}>Gap</button>
            </div>
          )}
        </div>
      </div>

      {view === 'map' && <MapView rows={rows} metric={getMetric(metricKey)} />}
      {view === 'visual' && <BarView rows={rows} series={series} />}
      {view === 'table' && <StateTable rows={rows} totals={totals} showExt={showExt} />}

      <hr className="divider" />
      <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }]} note="SNCU / NBSU counts (as on Oct 2024)" />
      <SourceNote
        refs={[{ key: 'srs2024', page: 'CBR' }, { key: 'ncpProj', page: 'population' }]}
        note="live births = crude birth rate × projected population"
      />
    </div>
  )
}
