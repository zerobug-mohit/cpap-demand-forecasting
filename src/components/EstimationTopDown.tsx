import { useMemo, useState } from 'react'
import { STATES2 } from '../data/states2'
import { computeAll2, DEFAULT_M2 } from '../engine/method2'
import type { M2Norms } from '../engine/method2'
import { fmt } from '../utils/format'
import M2NormsPanel from './M2NormsPanel'
import M2Explorer from './M2Explorer'
import M2Flow from './M2Flow'

const DRIVER_LABEL: Record<string, string> = {
  composite: 'LBW + NMR composite',
  lbw: 'LBW only',
  volume: 'volume only (uniform rate)',
}

interface Props {
  norms: M2Norms
  onChange: (n: M2Norms) => void
}

export default function EstimationTopDown({ norms, onChange }: Props) {
  const { rows, totals } = useMemo(() => computeAll2(STATES2, norms), [norms])
  const [open, setOpen] = useState(false)

  return (
    <div className="layout-grid">
      <M2NormsPanel norms={norms} onChange={onChange} onReset={() => onChange(DEFAULT_M2)} />

      <div>
        <div className="card lens-explainer">
          <button className="lens-toggle-head" onClick={() => setOpen(!open)} aria-expanded={open}>
            <div>
              <h2>How the epidemiological estimate works</h2>
              {!open && (
                <span className="lens-summary">
                  Population → institutional births → eligible cases → devices · national pool redistributed across states by an LBW + NMR risk index
                </span>
              )}
            </div>
            <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
          </button>
          {open && (
            <div style={{ marginTop: 12 }}>
              <p className="card-note">A clinical-need estimate independent of the facility network. The cascade below carries the current national figures through each step:</p>
              <M2Flow norms={norms} totals={totals} rows={rows} />
              <p style={{ fontSize: '0.88rem', margin: '14px 0 0' }}>
                The <strong>national</strong> eligible-case pool is anchored to the literature rate (RDS × correction) and
                then <strong>redistributed across states</strong> in proportion to <em>institutional births × risk-index<sup>β</sup></em>.
                The risk index blends each state's <strong>low-birth-weight %</strong> and <strong>neonatal mortality rate</strong>
                relative to the national level — the best all-state signals of prematurity/RDS burden, since state-wise RDS
                prevalence itself is not available. β and the weights are adjustable on the left; at β = 0 the rate is uniform
                (states differ only by births).
              </p>
            </div>
          )}
        </div>

        <div className="kpi-row">
          <div className="kpi accent-navy">
            <div className="kpi-label">CPAP required · national</div>
            <div className="kpi-value">{fmt(totals.gross)}</div>
            <div className="kpi-sub">devices, clinical-need ceiling</div>
          </div>
          <div className="kpi accent-teal">
            <div className="kpi-label">Institutional births</div>
            <div className="kpi-value">{fmt(totals.instBirths)}</div>
            <div className="kpi-sub">births × NFHS delivery rate</div>
          </div>
          <div className="kpi accent-teal">
            <div className="kpi-label">CPAP-eligible cases</div>
            <div className="kpi-value">{fmt(totals.eligible)}</div>
            <div className="kpi-sub">{totals.eligPer1000.toFixed(1)} per 1,000 inst. births</div>
          </div>
          <div className="kpi accent-good">
            <div className="kpi-label">State driver</div>
            <div className="kpi-value" style={{ fontSize: '1.05rem' }}>{DRIVER_LABEL[norms.driver]}</div>
            <div className="kpi-sub">β = {norms.beta.toFixed(2)}</div>
          </div>
        </div>

        <M2Explorer rows={rows} totals={totals} />

        <div className="card">
          <h2>Method &amp; caveats</h2>
          <ul className="src-list" style={{ paddingLeft: 18 }}>
            <li>National anchored to the literature RDS rate × correction factor; states carry the variance (anchor + redistribute).</li>
            <li>State driver = LBW + NMR composite (both national-standardised); NMR is NA for smaller states/UTs and defaults to neutral in the index.</li>
            <li>Tertiary-facility RDS studies overstate population prevalence (referral bias) — used only to set the national rate, never the state spread.</li>
            <li>No reliable state-wise preterm rate exists; LBW is the accepted stand-in.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
