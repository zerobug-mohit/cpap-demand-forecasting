import type { ReactNode } from 'react'
import type { M2Driver, M2Norms } from '../engine/method2'
import { DEFAULT_M2 } from '../engine/method2'
import { NATIONAL_PUBLIC_SHARE } from '../data/states2'
import SourceNote from './SourceNote'
import PanelSection from './PanelSection'
import DataCaveats from './DataCaveats'

interface Props {
  norms: M2Norms
  onChange: (n: M2Norms) => void
  onReset: () => void
}

function Slider({
  id, label, hint, value, min, max, step, display, changed, onChange,
}: {
  id?: string; label: string; hint?: string; value: number; min: number; max: number; step: number; display: string
  changed?: boolean; onChange: (v: number) => void
}) {
  return (
    <div className="field" id={id} style={{ marginBottom: 6 }}>
      <label>
        <span>
          {label}
          {changed !== undefined && (
            <span className={`badge ${changed ? 'entered' : 'preset'}`} style={{ marginLeft: 6 }}>
              {changed ? 'edited' : 'preset'}
            </span>
          )}
        </span>
        <span className="range-val">{display}</span>
      </label>
      <div className="range-row">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))} />
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

/** Non-linked basis line for inputs that are programme assumptions / analyst levers (no dataset). */
const Basis = ({ children }: { children: ReactNode }) => (
  <div className="source-note" style={{ marginBottom: 12 }}>
    <span className="src-prefix">Basis:</span> {children}
  </div>
)

const DRIVERS: { key: M2Driver; label: string }[] = [
  { key: 'composite', label: 'LBW + NMR' },
  { key: 'lbw', label: 'LBW only' },
  { key: 'volume', label: 'Volume' },
]

export default function M2NormsPanel({ norms, onChange, onReset }: Props) {
  const set = (patch: Partial<M2Norms>) => onChange({ ...norms, ...patch })
  const dirty = JSON.stringify(norms) !== JSON.stringify(DEFAULT_M2)
  const chg = (k: keyof M2Norms) => norms[k] !== DEFAULT_M2[k]

  return (
    <div className="card card-tight sticky-col">
      <div className="flex-between">
        <h2>Assumptions &amp; drivers</h2>
        <button className="btn link" onClick={onReset} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4 }}>Reset</button>
      </div>
      <p className="card-note">Epidemiological cascade. The national anchor is held fixed and redistributed across states by the driver. Each input's basis is noted below it.</p>

      <PanelSection
        title="Facility scope (public / private)"
        ids={['m2-publicShare']}
        badge={norms.publicOnly ? <span className="badge entered">public only</span> : undefined}
      >
        <label className="switch-row">
          <input type="checkbox" checked={norms.publicOnly} onChange={(e) => set({ publicOnly: e.target.checked })} />
          <span>Public (NHM) facilities only</span>
        </label>
        <p className="hint" style={{ marginTop: 6 }}>
          Anchors the eligible-case pool to <strong>public-facility</strong> institutional births and redistributes
          across states on that same base — the NHM procurement scope. Private-sector deliveries are excluded.
        </p>
        {norms.publicOnly && (
          <div id="m2-publicShare" style={{ marginTop: 8 }}>
            <label className="switch-row">
              <input type="checkbox" checked={norms.publicShareOverride !== null}
                onChange={(e) => set({ publicShareOverride: e.target.checked ? NATIONAL_PUBLIC_SHARE : null })} />
              <span>Use one custom share for all states</span>
            </label>
            {norms.publicShareOverride !== null ? (
              <Slider label="Public share (all states)" value={norms.publicShareOverride} min={0.2} max={1} step={0.01}
                display={`${Math.round(norms.publicShareOverride * 100)}%`} onChange={(v) => set({ publicShareOverride: v })}
                hint="Applied uniformly, overriding per-state NFHS values." />
            ) : (
              <p className="hint" style={{ marginTop: 6 }}>Using per-state NFHS-6 public shares (Kerala 34% … Ladakh 97%; national ~65%).</p>
            )}
            <SourceNote refs={[{ key: 'nfhs6', page: 'ind. 35–36' }]} note="public-facility share of institutional births" />
          </div>
        )}
      </PanelSection>

      <PanelSection title="National eligibility anchor" ids={['m2-rdsPer1000', 'm2-correction']}>
        <Slider id="m2-rdsPer1000" changed={chg('rdsPer1000')} label="RDS cases / 1,000 inst. births" value={norms.rdsPer1000} min={4} max={30} step={1}
          display={String(norms.rdsPer1000)} onChange={(v) => set({ rdsPer1000: v })} />
        <SourceNote
          refs={[{ key: 'rdsRecent', page: '25.3' }, { key: 'rdsAIIMS', page: '19.1' }, { key: 'nnpd', page: '12.0' }, { key: 'rdsAFMC', page: '4.5' }]}
          note="RDS per 1,000 births · India studies (range 4.5–25.3)"
        />
        <Slider id="m2-correction" changed={chg('correction')} label="Correction factor (other conditions)" value={norms.correction} min={1} max={3} step={0.1}
          display={norms.correction.toFixed(1) + '×'} onChange={(v) => set({ correction: v })}
          hint="Scales RDS up to all CPAP-treated conditions (TTN, MAS, pneumonia/sepsis, apnoea). Built as (% of distressed neonates put on CPAP) ÷ (RDS share of them): Aligarh 67.5% ÷ 35.5% = 1.9×; Navi Mumbai 68% ÷ 32.8% = 2.1× → median ≈ 2.0×." />
        <SourceNote
          refs={[{ key: 'rdsRecent', page: 'CPAP 67.5% ÷ RDS 35.5%' }, { key: 'distJain', page: 'CPAP 68% ÷ RDS 32.8%' }]}
          note="CPAP-put fraction ÷ RDS share · India resp-distress cohorts → ×1.9–2.1 (median ~2.0)"
        />
      </PanelSection>

      <PanelSection title="Care cascade" ids={['m2-durationDays', 'm2-admissionRate', 'm2-buffer']}>
        <Slider id="m2-durationDays" changed={chg('durationDays')} label="CPAP duration (days/case)" value={norms.durationDays} min={1} max={10} step={0.5}
          display={norms.durationDays.toFixed(1)} onChange={(v) => set({ durationDays: v })}
          hint="Median of Indian per-course studies ≈ 2 d (~1.9). Range 1.0 (Koti, early-RDS median) – 3.0 d (Tahreem, 28–34 wk RDS); shorter in early-start pure-RDS cohorts, longer with later/mixed case-mix." />
        <SourceNote
          refs={[{ key: 'cpapKoti', page: '0.98' }, { key: 'cpapNoolu', page: '2.27' }, { key: 'cpapTahreem', page: '3.01' }]}
          note="mean/median days on CPAP · India studies (range 1.0–3.0, median ≈2)"
        />
        <Slider id="m2-admissionRate" changed={chg('admissionRate')} label="Facility admission rate" value={norms.admissionRate} min={0.5} max={1} step={0.01}
          display={Math.round(norms.admissionRate * 100) + '%'} onChange={(v) => set({ admissionRate: v })} />
        <Basis>programme assumption (concept-note default 100%).</Basis>
        <Slider id="m2-buffer" changed={chg('buffer')} label="Planning buffer" value={norms.buffer} min={0} max={1} step={0.05}
          display={Math.round(norms.buffer * 100) + '%'} onChange={(v) => set({ buffer: v })}
          hint="One combined uplift on mean concurrent devices, covering peak-concurrency, device attrition and procurement lead-time / spares. Default 30%." />
        <Basis>programme assumption — clubs peak concurrency, attrition and lead-time.</Basis>
      </PanelSection>

      <PanelSection
        title="State-variance driver"
        ids={['m2-driver', 'm2-beta', 'm2-wLbw', 'm2-wNmr']}
        badge={chg('driver') ? <span className="badge entered">edited</span> : undefined}
      >
        <p className="card-note" style={{ marginTop: 0 }}>
          This does <strong>not</strong> change the national total — it only sets <strong>how that total is split across
          states</strong>. States with more low-birth-weight babies and higher newborn mortality take a larger share,
          because those signal a heavier RDS/prematurity burden.
        </p>
        <div className="scope-toggle" role="group" aria-label="Driver" id="m2-driver">
          {DRIVERS.map((d) => (
            <button key={d.key} className={norms.driver === d.key ? 'active' : ''} onClick={() => set({ driver: d.key })}>
              {d.label}
            </button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 6 }}>
          <strong>LBW + NMR</strong> — split by both signals (recommended). <strong>LBW only</strong> — by
          low-birth-weight rate alone. <strong>Volume</strong> — by births only, so every state gets the same rate per
          birth (no risk weighting).
        </p>
        <SourceNote refs={[{ key: 'nfhs6', page: 'inst. delivery' }, { key: 'nfhs5', page: 'LBW' }]} note="institutional delivery · LBW" />
        <SourceNote refs={[{ key: 'srs2024', page: 'Statement 48' }]} note="neonatal mortality rate" />
        <DataCaveats />

        {norms.driver !== 'volume' && (
          <div style={{ marginTop: 12 }}>
            <Slider id="m2-beta" changed={chg('beta')} label="Sensitivity β" value={norms.beta} min={0} max={1.5} step={0.05}
              display={norms.beta.toFixed(2)} onChange={(v) => set({ beta: v })}
              hint="How strongly a state's risk shifts its share. β = 0 → risk ignored, split by births only (every state the same rate per birth). β = 1 → full effect: a state with twice the risk index gets twice the per-birth rate. Higher β widens the gap between high- and low-risk states." />
            {norms.driver === 'composite' && (
              <>
                <p className="hint" style={{ margin: '4px 0 6px' }}>
                  Weights set how much each signal counts in the risk index — only their <strong>ratio</strong> matters
                  (currently LBW {norms.wLbw.toFixed(2)} : NMR {norms.wNmr.toFixed(2)}).
                </p>
                <Slider id="m2-wLbw" changed={chg('wLbw')} label="Weight — LBW" value={norms.wLbw} min={0} max={1} step={0.05}
                  display={norms.wLbw.toFixed(2)} onChange={(v) => set({ wLbw: v })}
                  hint="Emphasis on low-birth-weight rate (the closest available proxy for prematurity/RDS)." />
                <Slider id="m2-wNmr" changed={chg('wNmr')} label="Weight — NMR" value={norms.wNmr} min={0} max={1} step={0.05}
                  display={norms.wNmr.toFixed(2)} onChange={(v) => set({ wNmr: v })}
                  hint="Emphasis on neonatal mortality rate (a marker of overall sick-newborn burden)." />
              </>
            )}
            <Basis>β and weights are analyst-set model levers — no external source.</Basis>
          </div>
        )}
      </PanelSection>
    </div>
  )
}
