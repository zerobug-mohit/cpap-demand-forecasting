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

type NumKey = 'cpapPerBed' | 'avgSncuBeds'

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
    hint: 'The FBNC 2025 guideline says about 30% of SNCU beds should have a CPAP machine (about 4 in a 12-bed unit).',
    unit: 'per bed',
    min: 0.1,
    max: 1,
    step: 0.05,
    refs: [{ key: 'fbnc2025', page: 'p. 57, 60' }],
  },
  {
    key: 'avgSncuBeds',
    label: 'Avg beds per SNCU',
    hint: 'The beds per SNCU are not published, so we estimate total beds as the number of SNCUs times this average. This is the biggest single assumption.',
    unit: 'beds',
    min: 8,
    max: 30,
    step: 1,
    refs: [{ key: 'nhmSncu2013', page: 'p. 6' }, { key: 'fbnc2025', page: 'p. 21' }],
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
      <p className="card-note" style={{ marginTop: 2 }}>You can change any value below. Green means you changed it; amber is the preset default.</p>

      <PanelSection
        title="CPAP scope"
        badge={norms.scope !== 'sncu' ? <span className="badge entered">edited</span> : undefined}
      >
        <ScopeToggle scope={norms.scope} onChange={(scope) => onChange({ ...norms, scope })} />
        <p className="hint" style={{ marginTop: 6 }}>{SCOPE_LABEL[norms.scope]}</p>
      </PanelSection>

      <PanelSection title="SNCU norms" ids={['m1-cpapPerBed', 'm1-avgSncuBeds']}>
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

      <PanelSection
        title="Planning buffer"
        ids={['m1-buffer']}
        badge={norms.buffer !== DEFAULT_NORMS.buffer ? <span className="badge entered">edited</span> : <span className="badge preset">preset</span>}
      >
        <div className="field" id="m1-buffer">
          <label>
            <span>Buffer on total devices</span>
            <span className="range-val">{Math.round(norms.buffer * 100)}%</span>
          </label>
          <div className="range-row">
            <input type="range" min={0} max={1} step={0.05} value={norms.buffer}
              onChange={(e) => onChange({ ...norms, buffer: parseFloat(e.target.value) })} />
          </div>
          <span className="hint">
            A single uplift added to the final device total to cover busy periods, machines wearing out, and the time
            needed to order replacements. It is applied to every state and to the national total (the same 25% the
            epidemiological methods use).
          </span>
        </div>
      </PanelSection>

      {norms.scope !== 'sncu' && (
        <PanelSection title="NBSU / Transport add-on">
          <ExtendedNormsSection norms={norms} onChange={onChange} />
        </PanelSection>
      )}

      <PanelSection title="NICU note" defaultOpen={false}>
        <p className="card-note" style={{ marginTop: 0, marginBottom: 2 }}>
          The data source counts NICU beds together with SNCU beds, so NICUs are already included here and are not estimated separately.
        </p>
        <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }]} note="SNCU count includes NICUs" />
      </PanelSection>
    </div>
  )
}
