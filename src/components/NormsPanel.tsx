import type { Norms } from '../engine/method1'
import { DEFAULT_NORMS, SCOPE_LABEL } from '../engine/method1'
import ScopeToggle from './ScopeToggle'
import ExtendedNormsSection from './ExtendedNormsSection'
import SourceNote from './SourceNote'
import type { SourceRef } from './SourceNote'
import PanelSection from './PanelSection'

interface Props {
  norms: Norms
  onChange: (n: Norms) => void
  onReset: () => void
}

type NumKey = 'cpapPerBed' | 'avgSncuBeds' | 'normBedsPer1000'

interface RowDef {
  key: NumKey
  label: string
  hint: string
  unit: string
  min: number
  max: number
  step: number
  refs: SourceRef[]
}

const ROWS: RowDef[] = [
  {
    key: 'cpapPerBed',
    label: 'CPAP devices per SNCU bed',
    hint: 'FBNC 2025: ~30% of SNCU beds are CPAP-capable (4 per 12-bed unit).',
    unit: 'per bed',
    min: 0.1,
    max: 1,
    step: 0.05,
    refs: [{ key: 'fbnc2025', page: 'p. 57, 60' }],
  },
  {
    key: 'avgSncuBeds',
    label: 'Avg beds per SNCU',
    hint: 'Per-state beds are unpublished; beds = SNCU units × this. Biggest single assumption.',
    unit: 'beds',
    min: 8,
    max: 30,
    step: 1,
    refs: [{ key: 'nhmSncu2013', page: 'p. 6' }, { key: 'fbnc2025', page: 'p. 21' }],
  },
  {
    key: 'normBedsPer1000',
    label: 'Normative SNCU beds / 1,000 births',
    hint: 'FBNC-consistent build-out rule (12 beds per 3,000 deliveries = 4 per 1,000).',
    unit: 'beds/1k',
    min: 1,
    max: 8,
    step: 0.5,
    refs: [{ key: 'fbnc2025', page: 'p. 28' }, { key: 'inap2014', page: 'p. 57' }],
  },
]

export default function NormsPanel({ norms, onChange, onReset }: Props) {
  const dirty = (k: NumKey) => norms[k] !== DEFAULT_NORMS[k]
  const anyDirty = JSON.stringify(norms) !== JSON.stringify(DEFAULT_NORMS)

  return (
    <div className="card card-tight sticky-col">
      <div className="flex-between">
        <h2>Norms &amp; assumptions</h2>
        <button className="btn link" onClick={onReset} disabled={!anyDirty} style={{ opacity: anyDirty ? 1 : 0.4 }}>
          Reset
        </button>
      </div>
      <p className="card-note" style={{ marginTop: 2 }}>Editable levers · green = edited, amber = preset.</p>

      <PanelSection
        title="CPAP scope"
        badge={norms.scope !== 'sncu' ? <span className="badge entered">edited</span> : undefined}
      >
        <ScopeToggle scope={norms.scope} onChange={(scope) => onChange({ ...norms, scope })} />
        <p className="hint" style={{ marginTop: 6 }}>{SCOPE_LABEL[norms.scope]}</p>
      </PanelSection>

      <PanelSection title="SNCU norms" ids={['m1-cpapPerBed', 'm1-avgSncuBeds', 'm1-normBedsPer1000']}>
        {ROWS.map((r) => {
          const val = norms[r.key]
          const changed = dirty(r.key)
          return (
            <div className="field" key={r.key} id={`m1-${r.key}`}>
              <label>
                <span>{r.label}</span>
                <span className={`badge ${changed ? 'entered' : 'preset'}`}>{changed ? 'edited' : 'preset'}</span>
              </label>
              <div className="range-row">
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={val}
                  onChange={(e) => onChange({ ...norms, [r.key]: parseFloat(e.target.value) })}
                />
                <span className="range-val">
                  {r.key === 'cpapPerBed' ? val.toFixed(2) : val}
                </span>
              </div>
              <span className="hint">{r.hint}</span>
              <SourceNote refs={r.refs} />
            </div>
          )
        })}
      </PanelSection>

      {norms.scope !== 'sncu' && (
        <PanelSection title="NBSU / Transport add-on">
          <ExtendedNormsSection norms={norms} onChange={onChange} />
        </PanelSection>
      )}

      <PanelSection title="NICU note" defaultOpen={false}>
        <p className="card-note" style={{ marginTop: 0, marginBottom: 2 }}>
          NICU CPAP is folded into the SNCU count (the source merges the two), so it is not sized separately here.
        </p>
        <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }]} note="SNCU count includes NICUs" />
      </PanelSection>
    </div>
  )
}
