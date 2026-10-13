import { useState } from 'react'
import type { Norms, Totals } from '../engine/method1'
import type { ComputedRow } from '../engine/method1'
import { fmt } from '../utils/format'
import M1Flow from './M1Flow'

export default function LensExplainer({ totals, norms, rows }: { totals: Totals; norms: Norms; rows: ComputedRow[] }) {
  const [open, setOpen] = useState(false)
  const [geo, setGeo] = useState('National')
  const sortedStates = [...rows].map((r) => r.state).sort((a, b) => a.localeCompare(b))
  const flowTotals: Totals = geo === 'National' ? totals : (rows.find((r) => r.state === geo) ?? totals)

  return (
    <div className="card lens-explainer">
      <div className="explain-head">
        <button className="lens-toggle-head" onClick={() => setOpen(!open)} aria-expanded={open}>
          <div>
            <h2>How the current demand estimate works</h2>
            {!open && (
              <span className="lens-summary">
                We take the SNCUs that exist today, count their beds, and apply the government norm for CPAP per bed. With the planning buffer added, that gives <strong>{fmt(totals.asisCpap)} devices</strong>.
              </span>
            )}
          </div>
          <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 12 }}>
          <p className="card-note">
            This estimate is based only on the special newborn care units (SNCUs) that <strong>already exist today</strong>.
          </p>

          <div className="flex-between" style={{ marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="section-label" style={{ margin: 0 }}>Step-by-step calculation</div>
              <label className="ctrl-inline">
                <span className="muted">Show for</span>
                <select value={geo} onChange={(e) => setGeo(e.target.value)}>
                  <option value="National">India (national)</option>
                  {sortedStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </div>
          <M1Flow norms={norms} totals={flowTotals} />
        </div>
      )}
    </div>
  )
}
