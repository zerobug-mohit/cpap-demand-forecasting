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
      <button className="lens-toggle-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div>
          <h2>How the current infra-based estimate works</h2>
          {!open && (
            <span className="lens-summary">
              We take the SNCUs that exist today, count their beds, and apply the government norm for CPAP per bed. That comes to <strong>{fmt(totals.asisCpap)} devices</strong>.
            </span>
          )}
        </div>
        <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          <p className="card-note">
            This estimate is based only on the special newborn care units (SNCUs) that <strong>already exist today</strong>.
          </p>

          <div className="lens-box asis" style={{ maxWidth: 640 }}>
            <div className="lens-name">
              <span className="lens-dot" style={{ background: 'var(--c-asis)' }} />
              Based on today's SNCUs
            </div>
            <div className="lens-q">How many CPAP devices should the SNCUs we already have be equipped with?</div>
            <p className="lens-desc">
              For every SNCU that exists today, we count its beds and apply the FBNC guideline, which says about 30% of
              SNCU beds should have a CPAP machine. This gives the number of machines the current network <em>should</em>
              have if it followed the guideline. It is not a count of the machines actually installed, because those
              figures are not published. It is a realistic, near-term number.
            </p>
            <div className="lens-flow">SNCUs today → count their beds → apply CPAP-per-bed norm = <strong>{fmt(totals.asisCpap)} devices</strong></div>
            <p className="lens-blind">Note: this does not include places that need newborn care but do not have an SNCU yet. The Epidemiological need tab estimates that.</p>
          </div>

          <hr className="divider" />
          <div className="flex-between" style={{ marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="section-label" style={{ margin: 0 }}>Step-by-step calculation</div>
              <label className="ctrl-inline">
                <span className="muted">Geography</span>
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
