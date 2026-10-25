import { useState } from 'react'
import type { ComputedRow, Totals } from '../engine/method1'
import { METRICS, getMetric } from '../engine/metrics'
import MapView from './MapView'
import BarView, { SERIES_META } from './BarView'
import type { Series } from './BarView'
import StateTable from './StateTable'
import SourceNote from './SourceNote'
import { ExplainHere } from './Explain'

type View = 'map' | 'visual' | 'table'

interface Props {
  rows: ComputedRow[]
  totals: Totals
  showExt: boolean
}

export default function DataExplorer({ rows, totals, showExt }: Props) {
  const [view, setView] = useState<View>('map')
  const [metricKey, setMetricKey] = useState('asisCpap')
  const [series, setSeries] = useState<Series>({ asis: true, installed: true, gapGI: false })

  const MAX_SERIES = 3
  const activeCount = Object.values(series).filter(Boolean).length

  const toggleSeries = (k: keyof Series) => {
    const turningOn = !series[k]
    if (turningOn && activeCount >= MAX_SERIES) return // cap at 3 simultaneous
    const next = { ...series, [k]: !series[k] }
    if (!Object.values(next).some(Boolean)) return // keep at least one
    setSeries(next)
  }

  return (
    <div className="card" data-step="bu-states">
      <ExplainHere id="bu-states" label="State-wise results" />
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
              <span className="muted">Value</span>
              <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
                {METRICS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </label>
          )}
          {view === 'visual' && (
            <div className="series-toggle" style={{ flexWrap: 'wrap' }}>
              {SERIES_META.map((s) => {
                const on = series[s.flag]
                const blocked = !on && activeCount >= MAX_SERIES
                return (
                  <button
                    key={s.flag}
                    onClick={() => toggleSeries(s.flag)}
                    disabled={blocked}
                    title={blocked ? `You can show up to ${MAX_SERIES} at a time. Turn one off first.` : s.name}
                    style={on
                      ? { background: s.color, borderColor: s.color, color: '#fff' }
                      : { background: 'var(--c-surface)', borderColor: s.color, color: s.color, opacity: blocked ? 0.4 : 1, cursor: blocked ? 'not-allowed' : 'pointer' }}
                  >
                    {s.btn}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {view === 'map' && <MapView rows={rows} metric={getMetric(metricKey)} />}
      {view === 'visual' && <BarView rows={rows} series={series} />}
      {view === 'table' && <StateTable rows={rows} totals={totals} showExt={showExt} />}

      <hr className="divider" />
      <div className="section-label">Sources for state figures</div>
      <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }]} note="SNCU and NBSU counts (as on Oct 2024)" />
      <SourceNote
        refs={[{ key: 'srs2024', page: 'CBR' }, { key: 'ncpProj', page: 'population' }]}
        note="live births are worked out from the crude birth rate and the projected population"
      />
    </div>
  )
}
