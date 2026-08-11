import { useState } from 'react'
import type { Lens, Norms, Totals } from '../engine/method1'
import { fmt, fmtPct } from '../utils/format'
import M1Flow from './M1Flow'

export default function LensExplainer({ totals, norms }: { totals: Totals; norms: Norms }) {
  const [open, setOpen] = useState(false)
  const [diag, setDiag] = useState<Lens>('asis')

  return (
    <div className="card lens-explainer">
      <button className="lens-toggle-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div>
          <h2>Two ways to read the requirement</h2>
          {!open && (
            <span className="lens-summary">
              Guidelines-based <strong>{fmt(totals.asisCpap)}</strong> vs normative <strong>{fmt(totals.normCpap)}</strong> ·{' '}
              {fmtPct(totals.coverage)} coverage — what “guidelines-based” and “normative” mean
            </span>
          )}
        </div>
        <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          <p className="card-note">
            This tool answers the same question — how many CPAP devices does India need? — in two different ways.
            The toggle switches every figure below between them.
          </p>

          <div className="lens-grid">
            <div className="lens-box asis">
              <div className="lens-name">
                <span className="lens-dot" style={{ background: 'var(--c-asis)' }} />
                Guidelines-based estimation
              </div>
              <div className="lens-q">“What does the network we already have imply?”</div>
              <p className="lens-desc">
                Applies the FBNC norm to the beds of the SNCUs that <strong>exist today</strong> — the CPAP the current
                network <em>should</em> be equipped with per guidelines, not the devices actually installed (which
                aren't publicly reported). A grounded, near-term number.
              </p>
              <div className="lens-flow">current SNCUs → beds → × CPAP-per-bed = <strong>{fmt(totals.asisCpap)} devices</strong></div>
              <p className="lens-blind">⚠ Blind spot: misses need where no SNCU exists yet.</p>
            </div>

            <div className="lens-box norm">
              <div className="lens-name">
                <span className="lens-dot" style={{ background: 'var(--c-norm)' }} />
                Normative
              </div>
              <div className="lens-q">“What should a fully built-out network have?”</div>
              <p className="lens-desc">
                Ignores what exists and sizes the network from <strong>births</strong> using the government
                build-out rule, then applies the same norm. It is the target / ceiling for full coverage.
              </p>
              <div className="lens-flow">births → norm beds → × CPAP-per-bed = <strong>{fmt(totals.normCpap)} devices</strong></div>
              <p className="lens-blind">⚠ Blind spot: an ideal — can run ahead of what’s deliverable today.</p>
            </div>
          </div>

          <div className="lens-gap-note">
            <strong>Why both:</strong> the gap between them is the finding. The guidelines-based estimate sits at about{' '}
            <strong>{fmtPct(totals.coverage)}</strong> of the normative ceiling — a build-out shortfall of roughly{' '}
            <strong>{fmt(totals.cpapGap)} devices</strong>.
          </div>

          <hr className="divider" />
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <div className="section-label" style={{ margin: 0 }}>The calculation cascade</div>
            <div className="series-toggle">
              <button className={diag === 'asis' ? 'on asis' : ''} onClick={() => setDiag('asis')}>Guidelines-based</button>
              <button className={diag === 'normative' ? 'on norm' : ''} onClick={() => setDiag('normative')}>Normative</button>
            </div>
          </div>
          <M1Flow norms={norms} totals={totals} lens={diag} />
        </div>
      )}
    </div>
  )
}
