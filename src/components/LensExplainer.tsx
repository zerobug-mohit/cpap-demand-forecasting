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
              Current SNCUs → beds → × CPAP-per-bed norm = <strong>{fmt(totals.asisCpap)} devices</strong> — what today's network should be equipped with per FBNC
            </span>
          )}
        </div>
        <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          <p className="card-note">
            This is the <strong>guidelines-based</strong> estimate applied to the network that <strong>exists today</strong>.
          </p>

          <div className="lens-box asis" style={{ maxWidth: 640 }}>
            <div className="lens-name">
              <span className="lens-dot" style={{ background: 'var(--c-asis)' }} />
              Current infra-based
            </div>
            <div className="lens-q">“What does the SNCU network we already have imply?”</div>
            <p className="lens-desc">
              Applies the FBNC norm to the beds of the SNCUs that <strong>exist today</strong> — the CPAP the current
              network <em>should</em> be equipped with per guidelines, not the devices actually installed (which aren't
              publicly reported). A grounded, near-term number.
            </p>
            <div className="lens-flow">current SNCUs → beds → × CPAP-per-bed = <strong>{fmt(totals.asisCpap)} devices</strong></div>
            <p className="lens-blind">⚠ Blind spot: misses need where no SNCU exists yet — the epidemiological tab sizes that need directly.</p>
          </div>

          <hr className="divider" />
          <div className="flex-between" style={{ marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="section-label" style={{ margin: 0 }}>The calculation cascade</div>
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
