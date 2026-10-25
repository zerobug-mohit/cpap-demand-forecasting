import { useMemo } from 'react'
import type { PrivateNorms, PrivateTier } from '../engine/methodPrivate'
import { computePrivate, DEFAULT_PRIVATE } from '../engine/methodPrivate'
import { fmt } from '../utils/format'
import SourceNote from './SourceNote'
import { ExplainTitle, ExplainHere, useExplain } from './Explain'

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

  const inputsEx = useExplain('pvt-homes-inputs')
  return (
    <div className="layout-grid">
      {/* ---------------- controls ---------------- */}
      <div className="card card-tight sticky-col fc-panel" data-step="homes-inputs">
        <div className="flex-between">
          <h2>Private inputs</h2>
          <div className="explain-head" style={{ alignItems: 'center' }}>
            <button className="btn link" onClick={onReset} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4 }}>Reset</button>
            {inputsEx.bulb}
          </div>
        </div>
        {inputsEx.panel}
        <p className="card-note" style={{ marginTop: 2 }}>
          Private maternity homes are counted in three size groups. For each group, set how many homes there are and how
          many CPAP machines each home should have.
        </p>

        <div className="section-label" style={{ marginTop: 4 }}>Size groups</div>
        {norms.tiers.map((t, i) => (
          <div className="field" key={t.name} style={{ marginBottom: 8 }}>
            <div className="fc-mini" style={{ marginBottom: 4, color: 'var(--c-primary-dark)', fontSize: '0.72rem' }}>{t.name}</div>
            <div className="fc-row2">
              <NumField label="Maternity homes" value={t.count} step={500} onChange={(v) => setTier(i, { count: Math.round(v) })} />
              <NumField label="CPAP per home" value={t.cpap} step={0.5} onChange={(v) => setTier(i, { cpap: v })} />
            </div>
          </div>
        ))}
        <p className="hint" style={{ margin: '2px 0 10px' }}>This gives about <strong>{fmt(r.homesTotal)}</strong> maternity homes in total.</p>

        <ExplainHere id="pvt-homes-delivering" />
        <div className="fc-row2" style={{ marginBottom: 8 }}>
          <NumField label="% doing deliveries" value={norms.deliveryPct} max={100} onChange={(v) => onChange({ ...norms, deliveryPct: Math.min(100, v) })} />
        </div>
        <p className="hint" style={{ margin: '0 0 10px' }}>This gives about <strong>{fmt(r.delivering)}</strong> private facilities that do deliveries.</p>

        <SourceNote
          refs={[{ key: 'indiaHospEco', page: 'nursing homes <30 beds' }, { key: 'manyata', page: 'size mix' }]}
          note="There is no official list of private maternity homes. Private nursing homes with fewer than 30 beds are estimated at 35,000 to 40,000 in total. The number in each size group and the machines per home are assumptions that you can change."
        />
      </div>

      {/* ---------------- results ---------------- */}
      <div>
        <ExplainHere id="pvt-homes-kpis" />
        <div className="kpi-row" data-step="homes-result">
          <div className="kpi accent-navy">
            <div className="kpi-label">CPAP devices · private sector</div>
            <div className="kpi-value">{fmt(r.devices)}</div>
            <div className="kpi-sub">This assumes each home doing deliveries has the machines set for its group.</div>
          </div>
          <div className="kpi accent-teal">
            <div className="kpi-label">Maternity homes</div>
            <div className="kpi-value">{fmt(r.homesTotal)}</div>
            <div className="kpi-sub">total across all size groups</div>
          </div>
          <div className="kpi accent-good">
            <div className="kpi-label">Facilities doing deliveries</div>
            <div className="kpi-value">{fmt(r.delivering)}</div>
            <div className="kpi-sub">homes × % doing deliveries</div>
          </div>
        </div>

        <div className="card" data-step="homes-groups">
          <ExplainTitle id="pvt-homes-bars">Devices by size group</ExplainTitle>
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

          <ExplainHere id="pvt-homes-table" />
          <table className="fc-tier-tbl" style={{ borderTop: '1px solid var(--c-border)' }}>
            <thead>
              <tr>
                <th>Size group</th>
                <th className="fc-num">Maternity homes</th>
                <th className="fc-num">Doing deliveries</th>
                <th className="fc-num">CPAP per home</th>
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
                <td className="fc-num">–</td>
                <td className="fc-num">{fmt(r.devices)}</td>
              </tr>
            </tfoot>
          </table>

          <ExplainHere id="pvt-homes-total" />
          <div className="fc-grand">
            <span className="g-lab">Private total · CPAP devices</span>
            <span className="g-val fc-num">{fmt(r.devices)}</span>
            <span className="g-sub fc-num">{fmt(r.delivering)} private facilities doing deliveries</span>
          </div>
        </div>

        <div className="card" data-step="homes-limits">
          <ExplainTitle id="pvt-homes-caveats">Method and limits</ExplainTitle>
          <ul className="src-list" style={{ paddingLeft: 18 }}>
            <li>This is kept <strong>out</strong> of the public (government) estimates. The government does not buy machines for private facilities, but this shows the size of the private market.</li>
            <li>There is no official list of private maternity homes, so the number in each group (about 2,500 high, 5,000 medium and 30,000 small) and the machines per home are assumptions. By default, small homes with a basic setup have no CPAP.</li>
            <li>This assumes every home that does deliveries is fully equipped for its group. If only some homes have machines, lower the “% doing deliveries” or the machines per home.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
