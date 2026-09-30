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

export default function PrivateHomes({ norms, onChange, onReset }: Props) {
  const r = useMemo(() => computePrivate(norms), [norms])
  const dirty = JSON.stringify(norms) !== JSON.stringify(DEFAULT_PRIVATE)
  const setTier = (i: number, patch: Partial<PrivateTier>) => {
    const tiers = norms.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t))
    onChange({ ...norms, tiers })
  }

  return (
    <div className="layout-grid">
      {/* ---------------- controls ---------------- */}
      <div className="card card-tight sticky-col fc-panel">
        <div className="flex-between">
          <h2>Private inputs</h2>
          <button className="btn link" onClick={onReset} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4 }}>Reset</button>
        </div>
        <p className="card-note" style={{ marginTop: 2 }}>
          Private maternity homes are counted in three size groups. For each group, set how many homes there are and how
          many CPAP machines each home should have.
        </p>

        <div className="section-label" style={{ marginTop: 4 }}>Size tiers</div>
        {norms.tiers.map((t, i) => (
          <div className="field" key={t.name} style={{ marginBottom: 8 }}>
            <div className="fc-mini" style={{ marginBottom: 4, color: 'var(--c-primary-dark)', fontSize: '0.72rem' }}>{t.name}</div>
            <div className="fc-row2">
              <NumField label="Maternity homes" value={t.count} step={500} onChange={(v) => setTier(i, { count: Math.round(v) })} />
              <NumField label="CPAP / facility" value={t.cpap} step={0.5} onChange={(v) => setTier(i, { cpap: v })} />
            </div>
          </div>
        ))}
        <p className="hint" style={{ margin: '2px 0 10px' }}>Total maternity homes ≈ <strong>{fmt(r.homesTotal)}</strong></p>

        <div className="fc-row2" style={{ marginBottom: 8 }}>
          <NumField label="% doing deliveries" value={norms.deliveryPct} max={100} onChange={(v) => onChange({ ...norms, deliveryPct: Math.min(100, v) })} />
        </div>
        <p className="hint" style={{ margin: '0 0 10px' }}>→ delivering private facilities ≈ <strong>{fmt(r.delivering)}</strong></p>

        <SourceNote
          refs={[{ key: 'indiaHospEco', page: 'nursing homes <30 beds' }, { key: 'manyata', page: 'size mix' }]}
          note="There is no official registry of private maternity homes. Private nursing homes with fewer than 30 beds are estimated at 35,000–40,000 in total; the number in each size group and the machines per home are assumptions you can change."
        />
      </div>

      {/* ---------------- results ---------------- */}
      <div>
        <div className="kpi-row">
          <div className="kpi accent-navy">
            <div className="kpi-label">CPAP devices · private sector</div>
            <div className="kpi-value">{fmt(r.devices)}</div>
            <div className="kpi-sub">assumes each delivering home has the machines set for its group</div>
          </div>
          <div className="kpi accent-teal">
            <div className="kpi-label">Maternity homes</div>
            <div className="kpi-value">{fmt(r.homesTotal)}</div>
            <div className="kpi-sub">total across size tiers</div>
          </div>
          <div className="kpi accent-good">
            <div className="kpi-label">Delivering facilities</div>
            <div className="kpi-value">{fmt(r.delivering)}</div>
            <div className="kpi-sub">homes × % conducting deliveries</div>
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
                <th className="fc-num">Maternity homes</th>
                <th className="fc-num">Delivering</th>
                <th className="fc-num">CPAP/fac</th>
                <th className="fc-num">Devices</th>
              </tr>
            </thead>
            <tbody>
              {r.tiers.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td className="fc-num">{fmt(t.count)}</td>
                  <td className="fc-num">{fmt(t.facilities)}</td>
                  <td className="fc-num">{t.cpapPer}</td>
                  <td className="fc-num">{fmt(t.devices)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="fc-num">{fmt(r.homesTotal)}</td>
                <td className="fc-num">{fmt(r.delivering)}</td>
                <td className="fc-num">—</td>
                <td className="fc-num">{fmt(r.devices)}</td>
              </tr>
            </tfoot>
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
            <li>This is kept <strong>out</strong> of the public (government) estimates. The government does not buy machines for private facilities, but this shows the size of the private market.</li>
            <li>There is no official registry of private maternity homes, so the number in each group (about 2,500 high, 5,000 medium and 30,000 small) and the machines per home are assumptions. Small basic-setup homes are set to no CPAP by default.</li>
            <li>This assumes every home that does deliveries is fully equipped for its group. To model partial coverage, lower the “% doing deliveries” or the machines per home.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
