import { useMemo } from 'react'
import type { PrivateNorms, PrivateTier } from '../engine/methodPrivate'
import { computePrivate, DEFAULT_PRIVATE } from '../engine/methodPrivate'
import { fmt } from '../utils/format'
import SourceNote from './SourceNote'

interface Props {
  norms: PrivateNorms
  onChange: (n: PrivateNorms) => void
  onReset: () => void
}

function NumField({ label, value, min = 0, max, step = 1, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="fc-mini">{label}</div>
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(Math.max(min, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0))}
      />
    </div>
  )
}

export default function PrivateSector({ norms, onChange, onReset }: Props) {
  const r = useMemo(() => computePrivate(norms), [norms])
  const dirty = JSON.stringify(norms) !== JSON.stringify(DEFAULT_PRIVATE)
  const setTier = (i: number, patch: Partial<PrivateTier>) => {
    const tiers = norms.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t))
    onChange({ ...norms, tiers })
  }

  return (
    <div>
      <div className="card lens-explainer" style={{ marginBottom: 16 }}>
        <h2>Private-sector CPAP estimate</h2>
        <p className="card-note" style={{ marginTop: 4, marginBottom: 0 }}>
          The private maternity sector is sized <strong>separately</strong> from the public (NHM) network — it is outside
          the public-procurement scope, and its facilities are counted and equipped by <strong>size</strong>, not by
          delivery volume. Base = private nursing homes &lt;30 beds × the share conducting deliveries; each size tier is
          then equipped to a normative CPAP-per-facility level.
        </p>
      </div>

      <div className="layout-grid">
        {/* ---------------- controls ---------------- */}
        <div className="card card-tight sticky-col fc-panel">
          <div className="flex-between">
            <h2>Private inputs</h2>
            <button className="btn link" onClick={onReset} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4 }}>Reset</button>
          </div>
          <p className="card-note" style={{ marginTop: 2 }}>Separate cascade — split by facility size, not deliveries.</p>

          <div className="fc-row2" style={{ marginBottom: 8 }}>
            <NumField label="Nursing homes <30 beds" value={norms.homes} step={500} onChange={(v) => onChange({ ...norms, homes: Math.round(v) })} />
            <NumField label="% doing deliveries" value={norms.deliveryPct} max={100} onChange={(v) => onChange({ ...norms, deliveryPct: Math.min(100, v) })} />
          </div>
          <p className="hint" style={{ margin: '0 0 10px' }}>→ delivering private facilities ≈ <strong>{fmt(r.delivering)}</strong></p>

          <div className="section-label" style={{ marginTop: 4 }}>Size tiers</div>
          {norms.tiers.map((t, i) => (
            <div className="field" key={t.name} style={{ marginBottom: 8 }}>
              <div className="fc-mini" style={{ marginBottom: 4, color: 'var(--c-primary-dark)', fontSize: '0.72rem' }}>{t.name}</div>
              <div className="fc-row2">
                <NumField label="Share %" value={t.share} max={100} onChange={(v) => setTier(i, { share: v })} />
                <NumField label="CPAP / facility" value={t.cpap} onChange={(v) => setTier(i, { cpap: v })} />
              </div>
            </div>
          ))}
          {r.shareTotal !== 100 && (
            <p className="hint" style={{ color: 'var(--c-accent)' }}>⚠ Size shares sum to {r.shareTotal}% (not 100%).</p>
          )}

          <SourceNote
            refs={[{ key: 'indiaHospEco', page: 'nursing homes <30 beds' }, { key: 'manyata', page: 'size mix' }]}
            note="~35,000–40,000 private nursing homes × % conducting deliveries (default 100%, adjustable); size split assumed — no registry"
          />
        </div>

        {/* ---------------- results ---------------- */}
        <div>
          <div className="kpi-row">
            <div className="kpi accent-navy">
              <div className="kpi-label">CPAP devices · private sector</div>
              <div className="kpi-value">{fmt(r.devices)}</div>
              <div className="kpi-sub">normative — every delivering facility equipped to its tier</div>
            </div>
            <div className="kpi accent-teal">
              <div className="kpi-label">Delivering facilities</div>
              <div className="kpi-value">{fmt(r.delivering)}</div>
              <div className="kpi-sub">nursing homes × % conducting deliveries</div>
            </div>
            <div className="kpi accent-good">
              <div className="kpi-label">Avg CPAP / facility</div>
              <div className="kpi-value">{r.delivering > 0 ? (r.devices / r.delivering).toFixed(2) : '—'}</div>
              <div className="kpi-sub">blended across size tiers</div>
            </div>
          </div>

          <div className="card">
            <h2>Devices by size tier</h2>
            <div className="fc-bars">
              {r.tiers.map((t) => {
                const max = Math.max(1, ...r.tiers.map((x) => x.devices))
                const w = Math.max(2, (t.devices / max) * 100)
                return (
                  <div className="fc-barrow" key={t.name}>
                    <span className="fc-bname">{t.name}</span>
                    <span className="fc-track"><span className="fc-fill" style={{ width: `${w}%` }} /></span>
                    <span className="fc-bval fc-num">{fmt(t.devices)}</span>
                  </div>
                )
              })}
            </div>

            <table className="fc-tier-tbl" style={{ borderTop: '1px solid var(--c-border)' }}>
              <thead>
                <tr>
                  <th>Size tier</th>
                  <th className="fc-num">Facilities</th>
                  <th className="fc-num">CPAP/fac</th>
                  <th className="fc-num">Devices</th>
                </tr>
              </thead>
              <tbody>
                {r.tiers.map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td className="fc-num">{fmt(t.facilities)}</td>
                    <td className="fc-num">{t.cpapPer}</td>
                    <td className="fc-num">{fmt(t.devices)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="fc-grand">
              <span className="g-lab">Private total · CPAP devices</span>
              <span className="g-val fc-num">{fmt(r.devices)}</span>
              <span className="g-sub fc-num">{fmt(r.delivering)} delivering private facilities</span>
            </div>
          </div>

          <div className="card">
            <h2>Method &amp; caveats</h2>
            <ul className="src-list" style={{ paddingLeft: 18 }}>
              <li>Kept <strong>outside</strong> the public (NHM) estimates — this is not part of government procurement scope, but sizes the total market / private demand.</li>
              <li>No registry of delivering private maternity homes exists: the base (~35,000–40,000 nursing homes &lt;30 beds) and the % conducting deliveries are adjustable, and the size split is assumed (majority small).</li>
              <li>Normative by tier — assumes every delivering facility is equipped to its size level; lower "% doing deliveries" or the per-tier CPAP to model partial coverage.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
