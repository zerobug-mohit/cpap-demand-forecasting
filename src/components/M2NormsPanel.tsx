import type { ReactNode } from 'react'
import type { M2Driver, M2Norms } from '../engine/method2'
import { DEFAULT_M2, DEFAULT_M2_PRIVATE } from '../engine/method2'
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
  const priv = norms.sector === 'private'
  const DEF = priv ? DEFAULT_M2_PRIVATE : DEFAULT_M2
  const nationalShare = priv ? 1 - NATIONAL_PUBLIC_SHARE : NATIONAL_PUBLIC_SHARE
  const set = (patch: Partial<M2Norms>) => onChange({ ...norms, ...patch })
  const dirty = JSON.stringify(norms) !== JSON.stringify(DEF)
  const chg = (k: keyof M2Norms) => norms[k] !== DEF[k]

  return (
    <div className="card card-tight sticky-col">
      <div className="flex-between">
        <h2>Assumptions &amp; drivers</h2>
        <button className="btn link" onClick={onReset} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.4 }}>Reset</button>
      </div>
      <p className="card-note">This works out the machines needed from how common newborn breathing problems are. The national total is fixed; the controls below only change how it is split across states. Under each control is a note on where its value comes from.</p>

      <PanelSection
        title={priv ? 'Facility scope (private)' : 'Facility scope (public / private)'}
        ids={['m2-publicShare']}
        badge={priv ? <span className="badge entered">private only</span> : (norms.publicOnly ? <span className="badge entered">public only</span> : undefined)}
      >
        {priv ? (
          <p className="hint" style={{ marginTop: 0 }}>
            This counts only babies born in <strong>private facilities</strong> (the share of facility births that are
            not in public/government facilities). This is the private market, which the government does not buy for.
          </p>
        ) : (
          <>
            <label className="switch-row">
              <input type="checkbox" checked={norms.publicOnly} onChange={(e) => set({ publicOnly: e.target.checked })} />
              <span>Public (NHM) facilities only</span>
            </label>
            <p className="hint" style={{ marginTop: 6 }}>
              This counts only babies born in <strong>public (government) facilities</strong>, because that is what the
              government would buy machines for. Births in private facilities are left out.
            </p>
          </>
        )}
        {(priv || norms.publicOnly) && (
          <div id="m2-publicShare" style={{ marginTop: 8 }}>
            <label className="switch-row">
              <input type="checkbox" checked={norms.publicShareOverride !== null}
                onChange={(e) => set({ publicShareOverride: e.target.checked ? nationalShare : null })} />
              <span>Use one custom share for all states</span>
            </label>
            {norms.publicShareOverride !== null ? (
              <Slider label={`${priv ? 'Private' : 'Public'} share (all states)`} value={norms.publicShareOverride} min={priv ? 0 : 0.2} max={1} step={0.01}
                display={`${Math.round(norms.publicShareOverride * 100)}%`} onChange={(v) => set({ publicShareOverride: v })}
                hint="Applied uniformly, overriding per-state NFHS values." />
            ) : (
              <p className="hint" style={{ marginTop: 6 }}>
                {priv
                  ? 'Using per-state private shares = 1 − NFHS-6 public share (Kerala ~66% … Ladakh ~3%; national ~35%).'
                  : 'Using per-state NFHS-6 public shares (Kerala 34% … Ladakh 97%; national ~65%).'}
              </p>
            )}
            <SourceNote refs={[{ key: 'nfhs6', page: 'ind. 35–36' }]} note={`share of facility births that are in ${priv ? 'private' : 'public'} facilities`} />
          </div>
        )}
      </PanelSection>

      <PanelSection title="How many newborns need CPAP (national)" ids={['m2-rdsPer1000', 'm2-correction']}>
        <Slider id="m2-rdsPer1000" changed={chg('rdsPer1000')} label="RDS cases per 1,000 facility births" value={norms.rdsPer1000} min={4} max={30} step={1}
          display={String(norms.rdsPer1000)} onChange={(v) => set({ rdsPer1000: v })} />
        <SourceNote
          refs={[{ key: 'rdsRecent', page: '25.3' }, { key: 'rdsAIIMS', page: '19.1' }, { key: 'nnpd', page: '12.0' }, { key: 'rdsAFMC', page: '4.5' }]}
          note="RDS per 1,000 births · India studies (range 4.5–25.3)"
        />
        <Slider id="m2-correction" changed={chg('correction')} label="Correction factor (other conditions)" value={norms.correction} min={1} max={3} step={0.1}
          display={norms.correction.toFixed(1) + '×'} onChange={(v) => set({ correction: v })}
          hint="Respiratory distress (RDS) is not the only condition treated with CPAP. This factor scales the RDS number up to cover the others too, such as TTN, meconium aspiration, pneumonia, sepsis and apnoea. Indian studies suggest about 2 times: in Aligarh 67.5% of babies in breathing distress were put on CPAP while RDS made up 35.5% of them (1.9 times), and in Navi Mumbai it was 68% versus 32.8% (2.1 times)." />
        <SourceNote
          refs={[{ key: 'rdsRecent', page: 'CPAP 67.5% ÷ RDS 35.5%' }, { key: 'distJain', page: 'CPAP 68% ÷ RDS 32.8%' }]}
          note="CPAP-put fraction ÷ RDS share · India resp-distress cohorts → ×1.9–2.1 (median ~2.0)"
        />
      </PanelSection>

      <PanelSection title="From cases to machines" ids={['m2-durationDays', 'm2-admissionRate', 'm2-buffer']}>
        <Slider id="m2-durationDays" changed={chg('durationDays')} label="CPAP duration (days/case)" value={norms.durationDays} min={1} max={10} step={0.5}
          display={norms.durationDays.toFixed(1)} onChange={(v) => set({ durationDays: v })}
          hint="How many days a baby stays on CPAP in one course. The preset is 5 days, from the FBNC 2025 guidelines. Indian studies have observed shorter times on CPAP (Koti 1.0, Noolu 2.3, Tahreem 3.0 days), so 5 days is the more cautious planning figure." />
        <SourceNote refs={[{ key: 'fbnc2025', page: 'CPAP therapy' }]} note="CPAP duration per case (preset 5 d)" />
        <SourceNote
          refs={[{ key: 'cpapKoti', page: '0.98' }, { key: 'cpapNoolu', page: '2.27' }, { key: 'cpapTahreem', page: '3.01' }]}
          note="observed days on CPAP per course · India studies (1.0–3.0 days)"
        />
        <Slider id="m2-admissionRate" changed={chg('admissionRate')} label="Share of babies who reach a facility" value={norms.admissionRate} min={0.5} max={1} step={0.01}
          display={Math.round(norms.admissionRate * 100) + '%'} onChange={(v) => set({ admissionRate: v })} />
        <Basis>a programme assumption (the concept note uses 100%).</Basis>
        <Slider id="m2-buffer" changed={chg('buffer')} label="Planning buffer" value={norms.buffer} min={0} max={1} step={0.05}
          display={Math.round(norms.buffer * 100) + '%'} onChange={(v) => set({ buffer: v })}
          hint="A single extra allowance on top of the machines in use at any one time. It covers busy periods, machines that break or wear out, and the time needed to order replacements. The preset is 25%." />
        <Basis>a programme assumption that combines busy periods, wear-and-tear and reorder time.</Basis>
      </PanelSection>

      <PanelSection
        title="How the total is split across states"
        ids={['m2-driver', 'm2-beta', 'm2-wLbw', 'm2-wNmr']}
        badge={chg('driver') ? <span className="badge entered">edited</span> : undefined}
      >
        <p className="card-note" style={{ marginTop: 0 }}>
          This does <strong>not</strong> change the national total. It only decides <strong>how that total is shared
          across states</strong>. States with more low-birth-weight babies and higher newborn deaths get a larger share,
          because those point to greater need.
        </p>
        <div className="scope-toggle" role="group" aria-label="Driver" id="m2-driver">
          {DRIVERS.map((d) => (
            <button key={d.key} className={norms.driver === d.key ? 'active' : ''} onClick={() => set({ driver: d.key })}>
              {d.label}
            </button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 6 }}>
          <strong>LBW + NMR</strong> uses both signals (recommended). <strong>LBW only</strong> uses the
          low-birth-weight rate on its own. <strong>Volume</strong> ignores need and splits by number of births only, so
          every state gets the same rate per birth.
        </p>
        <SourceNote refs={[{ key: 'nfhs6', page: 'inst. delivery' }, { key: 'nfhs5', page: 'LBW' }]} note="institutional delivery · LBW" />
        <SourceNote refs={[{ key: 'srs2024', page: 'Statement 48' }]} note="neonatal mortality rate" />
        <DataCaveats />

        {norms.driver !== 'volume' && (
          <div style={{ marginTop: 12 }}>
            <Slider id="m2-beta" changed={chg('beta')} label="How strongly need affects the split" value={norms.beta} min={0} max={1.5} step={0.05}
              display={norms.beta.toFixed(2)} onChange={(v) => set({ beta: v })}
              hint="At 0, need is ignored and the split follows births only (every state gets the same rate per birth). At 1, a state with twice the need gets twice the rate per birth. Higher values widen the gap between high-need and low-need states." />
            {norms.driver === 'composite' && (
              <>
                <p className="hint" style={{ margin: '4px 0 6px' }}>
                  These set how much each signal counts. Only the <strong>ratio</strong> between them matters
                  (currently low birth weight {norms.wLbw.toFixed(2)} : newborn deaths {norms.wNmr.toFixed(2)}).
                </p>
                <Slider id="m2-wLbw" changed={chg('wLbw')} label="Weight — low birth weight" value={norms.wLbw} min={0} max={1} step={0.05}
                  display={norms.wLbw.toFixed(2)} onChange={(v) => set({ wLbw: v })}
                  hint="How much the low-birth-weight rate counts (the closest stand-in for premature birth)." />
                <Slider id="m2-wNmr" changed={chg('wNmr')} label="Weight — newborn death rate" value={norms.wNmr} min={0} max={1} step={0.05}
                  display={norms.wNmr.toFixed(2)} onChange={(v) => set({ wNmr: v })}
                  hint="How much the newborn death rate counts (a sign of how many newborns are seriously ill)." />
              </>
            )}
            <Basis>these are settings you choose; they have no external source.</Basis>
          </div>
        )}
      </PanelSection>
    </div>
  )
}
