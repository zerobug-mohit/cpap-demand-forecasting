import { useMemo } from 'react'
import type { Burden, M3Norms } from '../engine/method3'
import { computeM3, DEFAULT_M3 } from '../engine/method3'
import { fmt } from '../utils/format'
import SourceNote from './SourceNote'
import PanelSection from './PanelSection'
import EpiFacilityStates from './EpiFacilityStates'

interface Props {
  norms: M3Norms
  onChange: (n: M3Norms) => void
  onReset: () => void
}

function NumField({ label, value, min = 0, max, step = 1, disabled, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; disabled?: boolean; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="fc-mini">{label}</div>
      <input
        type="number" value={value} min={min} max={max} step={step} disabled={disabled}
        onChange={(e) => onChange(Math.max(min, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0))}
      />
    </div>
  )
}

export default function EpiFacility({ norms, onChange, onReset }: Props) {
  const r = useMemo(() => computeM3(norms), [norms])
  const dirty = JSON.stringify(norms) !== JSON.stringify(DEFAULT_M3)

  const setLevel = (i: number, patch: Partial<M3Norms['levels'][number]>) => {
    const levels = norms.levels.map((l, j) => (j === i ? { ...l, ...patch } : l))
    onChange({ ...norms, levels })
  }
  const setTier = (i: number, which: Exclude<Burden, 'low'>, raw: number) => {
    const val = Math.max(0, Math.min(100, raw || 0))
    const t = { ...norms.levels[i].tiers, [which]: val }
    t.low = Math.max(0, 100 - t.high - t.med)
    setLevel(i, { tiers: t })
  }
  const setAvg = (key: Burden, val: number) => onChange({ ...norms, avg: { ...norms.avg, [key]: Math.max(0, val) } })

  return (
    <div className="layout-grid">
      {/* ---------------- controls ---------------- */}
      <div className="card card-tight sticky-col fc-panel">
        <div className="flex-between">
          <h2>Facility tiers</h2>
          <button className="btn link" onClick={onReset} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4 }}>Reset</button>
        </div>
        <p className="card-note" style={{ marginTop: 2 }}>
          This covers the public network only. For each level, the number of CPAP machines is worked out as
          <strong> beds per 1,000 deliveries × CPAP machines per bed</strong> (the default 4 × 0.30 gives 1.2 machines
          per 1,000 deliveries). You can change both numbers. The <span className="fc-fbnc-tag">FBNC</span> tag marks the
          levels whose default follows the government guideline. Untick a level to leave it out. Private facilities are
          estimated on the <strong>Private sector Demand</strong> tab.
        </p>

        {norms.levels.map((l, i) => {
          const norm = l.beds * l.cpapPerBed
          return (
            <div className={`field ${l.inc ? '' : 'off'}`} key={l.key}>
              <div className="fc-num-label">
                <span>
                  <input type="checkbox" className="fc-inc" checked={l.inc} title="Include this level"
                    onChange={(e) => setLevel(i, { inc: e.target.checked })} />
                  {l.name}
                  {l.fbnc && <span className="fc-fbnc-tag">FBNC</span>}
                </span>
                <span className="fc-normv">{norm.toFixed(2)} /1k</span>
              </div>
              <div className="fc-row2">
                <NumField label="Beds / 1,000 del." value={l.beds} step={0.5} disabled={!l.inc} onChange={(v) => setLevel(i, { beds: v })} />
                <NumField label="CPAP / bed" value={l.cpapPerBed} max={1} step={0.05} disabled={!l.inc} onChange={(v) => setLevel(i, { cpapPerBed: v })} />
              </div>
            </div>
          )
        })}
        <SourceNote refs={[{ key: 'fbnc2025', page: 'p. 28, 57–60' }]} note="4 SNCU beds / 1,000 deliveries · CPAP = 30% of beds" />
        <p className="hint" style={{ marginTop: 6 }}>
          <strong>SDH &amp; CHC floor:</strong> every facility gets at least one CPAP machine. For each group we take the
          larger of the facility count and the number worked out from deliveries, so low-volume facilities settle at one
          machine each (marked <span className="fc-tag">≥1/fac</span> below).
        </p>

        <PanelSection title="Average deliveries / facility" defaultOpen={false}>
          <div className="fc-row3">
            <NumField label="High >3k/yr" value={norms.avg.high} step={250} onChange={(v) => setAvg('high', v)} />
            <NumField label="Med 1–3k" value={norms.avg.med} step={250} onChange={(v) => setAvg('med', v)} />
            <NumField label="Low <1k" value={norms.avg.low} step={50} onChange={(v) => setAvg('low', v)} />
          </div>
          <SourceNote
            refs={[{ key: 'fbnc2025', page: 'burden cutoffs' }]}
            note="cutoffs (annual deliveries): High >3,000 · Medium 1,000–3,000 · Low <1,000 (SNCU / NBSU / NBCC)"
          />
          <SourceNote refs={[{ key: 'sharmaBmj', page: 'CHC ~490/yr' }]} note="the Low-group average uses the CHC median; the High and Medium averages are assumed" />
        </PanelSection>

        <PanelSection title="Facility counts & burden split" defaultOpen={false}>
          <SourceNote
            refs={[{ key: 'healthDynamics', page: 'DH 714 · SDH 1,340 · CHC 6,359' }, { key: 'nmcColleges', page: '~362 govt' }]}
            note="facility counts; burden % splits assumed"
          />
          {norms.levels.map((l, i) => (
            <div className="field" key={l.key} style={{ marginTop: 8 }}>
              <div className="fc-mini" style={{ marginBottom: 4, color: 'var(--c-primary-dark)', fontSize: '0.72rem' }}>{l.name}</div>
              <div className="fc-row3">
                <NumField label="Count" value={l.count} onChange={(v) => setLevel(i, { count: Math.round(v) })} />
                <NumField label="High %" value={l.tiers.high} max={100} disabled={l.lock} onChange={(v) => setTier(i, 'high', v)} />
                <NumField label="Med %" value={l.tiers.med} max={100} disabled={l.lock} onChange={(v) => setTier(i, 'med', v)} />
              </div>
              {l.lock && <p className="hint" style={{ marginTop: 4 }}>Held at 100% High — a DH / Medical College is Level-3 regardless of caseload (FBNC).</p>}
            </div>
          ))}
        </PanelSection>
      </div>

      {/* ---------------- results ---------------- */}
      <div>
        <div className="kpi-row">
          <div className="kpi accent-navy">
            <div className="kpi-label">CPAP devices · public need</div>
            <div className="kpi-value">{fmt(r.totals.devices)}</div>
            <div className="kpi-sub">included public levels (private on its own tab)</div>
          </div>
          <div className="kpi accent-teal">
            <div className="kpi-label">Institutional deliveries modelled</div>
            <div className="kpi-value">{fmt(r.totals.deliveries)}</div>
            <div className="kpi-sub">public, delivery-based levels</div>
          </div>
          <div className="kpi accent-good">
            <div className="kpi-label">Facilities counted</div>
            <div className="kpi-value">{fmt(r.totals.facilities)}</div>
            <div className="kpi-sub">across included public levels</div>
          </div>
        </div>

        <div className="card">
          <p className="card-note" style={{ marginTop: 0 }}>
            The number of <strong>deliveries</strong> here is the facility count times the average deliveries per facility
            in each group, added up over the four public levels. It leaves out PHCs and sub-centres, so it will not match
            the births figure used by the RDS-based approach. The <strong>private sector</strong> is estimated separately
            on its own tab.
          </p>
          <SourceNote
            refs={[{ key: 'healthDynamics', page: 'facility counts' }, { key: 'sharmaBmj', page: 'CHC ~490/yr' }, { key: 'fbnc2025', page: 'norm & cutoffs' }]}
            note="counts · per-tier delivery averages · device norm"
          />

          <h2 style={{ marginTop: 14 }}>Devices by level</h2>
          <div className="fc-bars">
            {r.bars.length === 0 && <p className="card-note">No levels selected.</p>}
            {r.bars.map((b) => {
              const w = Math.max(2, (b.devices / r.maxBar) * 100)
              return (
                <div className="fc-barrow" key={b.name}>
                  <span className="fc-bname">{b.name}</span>
                  <span className="fc-track"><span className="fc-fill" style={{ width: `${w}%` }} /></span>
                  <span className="fc-bval fc-num">{fmt(b.devices)}</span>
                </div>
              )
            })}
          </div>

          <h2 style={{ marginTop: 4 }}>
            Full breakdown <span className="muted" style={{ fontWeight: 400, fontSize: '0.76rem' }}>· click a level to open its tiers</span>
          </h2>
          {r.sections.map((s) => {
            if (s.excluded) {
              return (
                <div className="fc-lvl excl" key={s.key}>
                  <div className="fc-lvl-static">
                    <span style={{ color: 'var(--c-text-muted)' }}>·</span>
                    <span className="fc-lvl-name">{s.name}</span>
                    <span className="fc-lvl-meta" style={{ flex: 1 }}>excluded</span>
                    <span className="fc-lvl-dev">0</span>
                  </div>
                </div>
              )
            }
            return (
              <details className="fc-lvl" key={s.key}>
                <summary>
                  <span className="fc-lvl-name">{s.name}</span>
                  <span className="fc-lvl-meta" style={{ flex: 1 }}>{fmt(s.facilities)} facs · {fmt(s.deliveries)} del</span>
                  <span className="fc-lvl-dev">{fmt(s.devices)}</span>
                </summary>
                <table className="fc-tier-tbl">
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th className="fc-num">Facilities</th>
                      <th className="fc-num">Deliveries</th>
                      <th className="fc-num">{s.midHead}</th>
                      <th className="fc-num">Devices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.tiers.map((t) => (
                      <tr key={t.label}>
                        <td>{t.label}</td>
                        <td className="fc-num">{fmt(t.facilities)}</td>
                        <td className="fc-num">{fmt(t.deliveries)}</td>
                        <td className="fc-num">{t.mid}</td>
                        <td className="fc-num">
                          {fmt(t.devices)}
                          {t.floored && <span className="fc-tag" style={{ marginLeft: 6 }} title="Floored to one CPAP per facility (exceeds the delivery-based norm)">≥1/fac</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )
          })}

          <div className="fc-grand">
            <span className="g-lab">Public total · CPAP devices</span>
            <span className="g-val fc-num">{fmt(r.totals.devices)}</span>
            <span className="g-sub fc-num">{fmt(r.totals.facilities)} facilities · {fmt(r.totals.deliveries)} public deliveries</span>
          </div>
        </div>

        <EpiFacilityStates norms={norms} />

        <div className="card">
          <h2>Method &amp; caveats</h2>
          <ul className="src-list" style={{ paddingLeft: 18 }}>
            <li>This is a <strong>need</strong> estimate. It works out how many machines a properly-equipped public network would require, not how many are installed today.</li>
            <li>The facility counts and the FBNC norm come from published sources. The split of facilities into high, medium and low groups and the average deliveries for the high and medium groups are our own assumptions, because there is no published breakdown. You can change them on the left.</li>
            <li>District Hospitals and medical colleges are all treated as high-volume, because under FBNC they are the top level of newborn care whatever their number of deliveries.</li>
            <li><strong>SDH and CHC</strong> get at least one CPAP machine per facility: for each group we take the larger of the facility count and the number worked out from deliveries, so low-volume facilities settle at one machine each.</li>
            <li>This covers the four public levels only (District Hospitals, medical colleges, Sub-District Hospitals and CHCs) and leaves out PHCs and sub-centres. The <strong>private sector</strong> is a separate estimate on its own tab.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
