import { useState } from 'react'
import type { FacilityExt, Norms } from '../engine/method1'
import { hasNbsu, hasTransport } from '../engine/method1'
import { STATES } from '../data/states'
import { fmt } from '../utils/format'
import SourceNote from './SourceNote'

interface Props {
  norms: Norms
  onChange: (n: Norms) => void
}

const NBSU_TOTAL = STATES.reduce((a, s) => a + s.nbsu, 0)
const SNCU_TOTAL = STATES.reduce((a, s) => a + s.sncu, 0)

function NbsuControls({ ext, onExt }: { ext: FacilityExt; onExt: (e: FacilityExt) => void }) {
  return (
    <div className="ext-facility">
      <div className="ext-facility-head">
        NBSU <span className="muted">· {fmt(NBSU_TOTAL)} units</span>
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label>
          <span>% carrying CPAP</span>
          <span className="range-val">{Math.round(ext.pct * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(ext.pct * 100)}
          onChange={(e) => onExt({ ...ext, pct: parseInt(e.target.value) / 100 })}
        />
      </div>
      <div className="ext-grid">
        <label className="mini-field">
          <span>Beds / unit</span>
          <input
            type="number"
            min={0}
            step={1}
            value={ext.bedsPerFacility}
            onChange={(e) => onExt({ ...ext, bedsPerFacility: parseFloat(e.target.value) || 0 })}
          />
        </label>
        <label className="mini-field">
          <span>CPAP / bed</span>
          <input
            type="number"
            min={0}
            step={0.05}
            value={ext.cpapPerBed}
            onChange={(e) => onExt({ ...ext, cpapPerBed: parseFloat(e.target.value) || 0 })}
          />
        </label>
      </div>
    </div>
  )
}

function TransportControls({ norms, onChange }: Props) {
  const t = norms.transport
  return (
    <div className="ext-facility">
      <div className="ext-facility-head">
        Transport <span className="muted">· portable CPAP for referrals</span>
      </div>
      <div className="ext-grid">
        <label className="mini-field">
          <span>Units / SNCU</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={t.perSncu}
            onChange={(e) => onChange({ ...norms, transport: { ...t, perSncu: parseFloat(e.target.value) || 0 } })}
          />
        </label>
        <label className="mini-field">
          <span>Units / NBSU</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={t.perNbsu}
            onChange={(e) => onChange({ ...norms, transport: { ...t, perNbsu: parseFloat(e.target.value) || 0 } })}
          />
        </label>
      </div>
      <p className="mini-hint">
        Proxied by facility counts ({fmt(SNCU_TOTAL)} SNCUs, {fmt(NBSU_TOTAL)} NBSUs) — no transfer-volume data yet.
      </p>
      <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }]} note="facility counts" />
    </div>
  )
}

function StateOverrides({ norms, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ovrCount = Object.keys(norms.overrides).length

  const setOverride = (state: string, pctText: string) => {
    const overrides = { ...norms.overrides }
    if (pctText === '') delete overrides[state]
    else overrides[state] = { nbsuPct: Math.max(0, Math.min(100, parseFloat(pctText))) / 100 }
    onChange({ ...norms, overrides })
  }

  return (
    <div className="collapse nested">
      <button className="collapse-head sub" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
        Adjust NBSU % by state
        {ovrCount > 0 && <span className="collapse-tag active">{ovrCount} set</span>}
      </button>
      {open && (
        <div className="collapse-body">
          <div className="flex-between" style={{ marginBottom: 6 }}>
            <span className="muted" style={{ fontSize: '0.72rem' }}>Blank = overall default (%)</span>
            <button className="btn link" onClick={() => onChange({ ...norms, overrides: {} })} disabled={ovrCount === 0}>
              Clear
            </button>
          </div>
          <div className="ovr-scroll">
            <table className="ovr-table">
              <thead>
                <tr>
                  <th>State / UT</th>
                  <th>NBSUs</th>
                  <th>NBSU %</th>
                </tr>
              </thead>
              <tbody>
                {STATES.map((s) => {
                  const ov = norms.overrides[s.state]
                  return (
                    <tr key={s.state}>
                      <td title={s.state}>{s.state}</td>
                      <td className="ovr-count">{fmt(s.nbsu)}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder={String(Math.round(norms.nbsu.pct * 100))}
                          value={ov?.nbsuPct !== undefined ? Math.round(ov.nbsuPct * 100) : ''}
                          onChange={(e) => setOverride(s.state, e.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExtendedNormsSection({ norms, onChange }: Props) {
  if (!hasNbsu(norms)) return null

  return (
    <div className="scope-params">
      <p className="ext-note">
        ⚠ Current FBNC guidelines do <strong>not</strong> provide for CPAP at NBSUs or during transport. The tiers
        below are what-if add-ons — included in the totals so you can test their effect.
      </p>
      <SourceNote refs={[{ key: 'fbnc2025', page: 'p. 57' }]} note="NBSU/NBCC equipment package (no CPAP)" />

      <NbsuControls ext={norms.nbsu} onExt={(nbsu) => onChange({ ...norms, nbsu })} />
      {hasTransport(norms) && <TransportControls norms={norms} onChange={onChange} />}
      <StateOverrides norms={norms} onChange={onChange} />
    </div>
  )
}
