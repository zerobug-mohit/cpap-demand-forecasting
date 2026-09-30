import { useMemo, useState } from 'react'
import { STATES2 } from '../data/states2'
import { computeAll2, DEFAULT_M2, DEFAULT_M2_PRIVATE } from '../engine/method2'
import type { M2Norms } from '../engine/method2'
import { fmt } from '../utils/format'
import M2NormsPanel from './M2NormsPanel'
import M2Explorer from './M2Explorer'
import M2Flow from './M2Flow'

const DRIVER_LABEL: Record<string, string> = {
  composite: 'Low birth weight + newborn deaths',
  lbw: 'Low birth weight only',
  volume: 'Births only (no need weighting)',
}

interface Props {
  norms: M2Norms
  onChange: (n: M2Norms) => void
}

export default function EpiRds({ norms, onChange }: Props) {
  const { rows, totals } = useMemo(() => computeAll2(STATES2, norms), [norms])
  const [open, setOpen] = useState(false)
  const priv = norms.sector === 'private'
  const scoped = priv || norms.publicOnly

  return (
    <div className="layout-grid">
      <M2NormsPanel norms={norms} onChange={onChange} onReset={() => onChange(priv ? DEFAULT_M2_PRIVATE : DEFAULT_M2)} />

      <div>
        <div className="card lens-explainer">
          <button className="lens-toggle-head" onClick={() => setOpen(!open)} aria-expanded={open}>
            <div>
              <h2>How the RDS-based estimate works</h2>
              {!open && (
                <span className="lens-summary">
                  We start from the number of newborns, work out how many are likely to need CPAP, turn that into a number of machines, and then split it across states.
                </span>
              )}
            </div>
            <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
          </button>
          {open && (
            <div style={{ marginTop: 12 }}>
              <p className="card-note">This estimate is based on how common newborn breathing problems are, not on the facilities that exist today. The steps below show how we get from the number of births to the number of machines, using the current national figures:</p>
              <M2Flow norms={norms} totals={totals} rows={rows} />
              <p style={{ fontSize: '0.88rem', margin: '14px 0 0' }}>
                We first work out the number of newborns likely to need CPAP for the whole country. We take the rate of
                respiratory distress (RDS) reported in Indian studies and multiply it by a correction factor to also cover
                other conditions that need CPAP. We then <strong>split this national number across states</strong>. States
                with more low-birth-weight babies and higher newborn deaths get a larger share, because those are signs of
                greater need. We use these two signals because a state-by-state RDS rate is not available. You can adjust how
                strongly need affects the split, and the weight given to each signal, using the controls on the left.
              </p>
            </div>
          )}
        </div>

        <div className="kpi-row">
          <div className="kpi accent-navy">
            <div className="kpi-label">CPAP devices needed · national</div>
            <div className="kpi-value">{fmt(totals.gross)}</div>
            <div className="kpi-sub">the total this level of need implies</div>
          </div>
          <div className="kpi accent-teal">
            <div className="kpi-label">{priv ? 'Births in private facilities' : scoped ? 'Births in public facilities' : 'Births in facilities'}</div>
            <div className="kpi-value">{fmt(scoped ? totals.baseInstBirths : totals.instBirths)}</div>
            <div className="kpi-sub">{priv ? 'births × delivery rate × private-facility share' : scoped ? 'births × delivery rate × public-facility share' : 'births × facility-delivery rate'}</div>
          </div>
          <div className="kpi accent-teal">
            <div className="kpi-label">Newborns likely to need CPAP</div>
            <div className="kpi-value">{fmt(totals.eligible)}</div>
            <div className="kpi-sub">{totals.eligPer1000.toFixed(1)} per 1,000 births in {priv ? 'private' : scoped ? 'public' : ''} facilities</div>
          </div>
          <div className="kpi accent-good">
            <div className="kpi-label">How the total is split</div>
            <div className="kpi-value" style={{ fontSize: '1.05rem' }}>{DRIVER_LABEL[norms.driver]}</div>
            <div className="kpi-sub">need weighting strength: {norms.beta.toFixed(2)}</div>
          </div>
        </div>

        <M2Explorer rows={rows} totals={totals} />

        <div className="card">
          <h2>Method &amp; caveats</h2>
          <ul className="src-list" style={{ paddingLeft: 18 }}>
            <li>We work out the national number first, then split it across states.</li>
            <li>States are split using two signals: the share of low-birth-weight babies and the newborn death rate, each compared to the national level. The newborn death rate is not reported for smaller states and union territories, so for them we use low birth weight only.</li>
            <li>The RDS rates come from studies in large referral hospitals, which see sicker babies than the general population. We use them only to set the national number, not to decide each state's share.</li>
            <li>There is no reliable state-by-state rate of premature birth, so we use low birth weight as the closest available substitute.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
