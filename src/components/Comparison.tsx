import { useMemo, useState } from 'react'
import type { Norms } from '../engine/method1'
import type { M2Norms } from '../engine/method2'
import { compare, classify, CLS_LABEL } from '../engine/compare'
import type { BuLens } from '../engine/compare'
import { fmt, fmtPct } from '../utils/format'
import CmpScatter from './CmpScatter'
import CmpMap from './CmpMap'
import CmpTable from './CmpTable'
import SourceNote from './SourceNote'

interface Props {
  m1: Norms
  m2: M2Norms
}

type View = 'scatter' | 'map' | 'table'

function TriBar({ existing, td, normative }: { existing: number; td: number; normative: number }) {
  const max = Math.max(existing, td, normative, 1)
  const pct = (v: number) => `${(v / max) * 100}%`
  const seg = (a: number, b: number) => ({ left: pct(Math.min(a, b)), width: pct(Math.abs(b - a)) })
  const TIER_H = 32 // px each staggered label drops by
  const MIN_GAP = 18 // % of width below which two labels would collide → stagger
  const marks = [
    { key: 'existing', v: existing, label: 'Guidelines-based', color: 'var(--c-primary)' },
    { key: 'td', v: td, label: 'Clinical need', color: 'var(--c-accent)' },
    { key: 'normative', v: normative, label: 'Normative', color: 'var(--c-primary-dark)' },
  ].map((m) => ({ ...m, p: (m.v / max) * 100 }))

  // Assign each label a vertical tier so near-identical positions don't overlap.
  const tierLast: number[] = []
  const tier: Record<string, number> = {}
  for (const m of [...marks].sort((a, b) => a.p - b.p)) {
    let t = 0
    while (tierLast[t] !== undefined && m.p - tierLast[t] < MIN_GAP) t++
    tierLast[t] = m.p
    tier[m.key] = t
  }
  const maxTier = Math.max(0, ...Object.values(tier))

  return (
    <div className="tri-wrap">
      <div className="tri-track">
        <div className="tri-seg current" style={{ left: 0, width: pct(existing) }} />
        <div className="tri-seg gap" style={seg(existing, td)} />
        <div className="tri-seg head" style={seg(td, normative)} />
        {marks.map((m) => {
          const align = m.p > 88 ? 'right' : m.p < 12 ? 'left' : 'center'
          const t = tier[m.key]
          const lineH = 42 + t * TIER_H
          return (
            <div key={m.key} className={`tri-mark ${align}`} style={{ left: pct(m.v), height: lineH }}>
              <div className="tri-mark-line" style={{ background: m.color, height: lineH }} />
              <div className="tri-mark-label" style={{ top: 44 + t * TIER_H }}>
                <span style={{ color: m.color }}>{m.label}</span>
                <b>{fmt(m.v)}</b>
              </div>
            </div>
          )
        })}
      </div>
      <div className="legend-row" style={{ marginTop: 62 + maxTier * TIER_H }}>
        <span><span className="legend-dot" style={{ background: 'var(--c-primary)' }} />Guidelines-based</span>
        <span><span className="legend-dot" style={{ background: 'var(--c-accent)' }} />Gap to clinical need</span>
        <span><span className="legend-dot" style={{ background: 'var(--c-primary-dark)', opacity: 0.55 }} />Normative ceiling</span>
      </div>
    </div>
  )
}

export default function Comparison({ m1, m2 }: Props) {
  const { rows, nat } = useMemo(() => compare(m1, m2), [m1, m2])
  const [view, setView] = useState<View>('scatter')
  const [lens, setLens] = useState<BuLens>('existing')
  const [scope, setScope] = useState<string>('national')

  const sortedStates = useMemo(() => rows.map((r) => r.state).sort((a, b) => a.localeCompare(b)), [rows])
  const sel = scope === 'national' ? null : rows.find((r) => r.state === scope) ?? null
  const active = sel
    ? { existing: sel.buExisting, td: sel.td, normative: sel.buNormative }
    : { existing: nat.buExisting, td: nat.td, normative: nat.buNormative }

  const coverage = active.td > 0 ? active.existing / active.td : 0
  const buildVsNeed = active.td > 0 ? active.normative / active.td : 0
  const underserved = rows.filter((r) => classify(r.buExisting, r.td) === 'under').length
  const cls = sel ? classify(active.existing, active.td) : null

  return (
    <div>
      <div className="card lens-explainer">
        <div className="cmp-scope">
          <label htmlFor="cmp-scope-sel">Scope</label>
          <select id="cmp-scope-sel" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="national">National (all states)</option>
            {sortedStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <h2>Triangulating the two methods</h2>
        <p className="card-note">
          Two independent estimates bracket the planning decision — what exists, what clinical need implies, and what a
          full norm-based build-out would reach.
        </p>
        <TriBar existing={active.existing} td={active.td} normative={active.normative} />
        <div className="lens-gap-note" style={{ marginTop: 26 }}>
          {sel
            ? <><strong>{scope}</strong>'s current SNCU network implies <strong>{fmt(active.existing)}</strong> devices — about </>
            : <>India's current SNCU network implies <strong>{fmt(active.existing)}</strong> devices — about </>}
          <strong>{fmtPct(coverage)}</strong> of the <strong>{fmt(active.td)}</strong> implied by clinical need
          (epidemiological).{' '}
          {buildVsNeed >= 1
            ? <>A full FBNC-normative build-out (<strong>{fmt(active.normative)}</strong>) would <strong>exceed</strong> clinical need by {fmtPct(buildVsNeed - 1)} — the norm-based target runs ahead of epidemiological need.</>
            : <>Even a full FBNC build-out (<strong>{fmt(active.normative)}</strong>) would <strong>fall short</strong> of clinical need by {fmtPct(1 - buildVsNeed)}.</>}{' '}
          {sel
            ? <>This state's guidelines-based estimate is <strong>{CLS_LABEL[cls!].toLowerCase()}</strong> against clinical need (ratio {coverage.toFixed(2)}×).</>
            : <><strong>{underserved}</strong> of {rows.length} states are under-served (guidelines-based requirement below two-thirds of need).</>}
        </div>
      </div>

      <div className="card">
        <div className="explorer-head">
          <div className="toggle-group" role="tablist" aria-label="View">
            {(['scatter', 'map', 'table'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                {v === 'scatter' ? 'Scatter' : v === 'map' ? 'Map' : 'Table'}
              </button>
            ))}
          </div>
          {view !== 'table' && (
            <div className="explorer-controls">
              <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Infrastructure lens</span>
              <div className="series-toggle">
                <button className={lens === 'existing' ? 'on asis' : ''} onClick={() => setLens('existing')}>Guidelines-based</button>
                <button className={lens === 'normative' ? 'on norm' : ''} onClick={() => setLens('normative')}>Normative</button>
              </div>
            </div>
          )}
        </div>

        {view === 'scatter' && <CmpScatter rows={rows} lens={lens} />}
        {view === 'map' && <CmpMap rows={rows} lens={lens} />}
        {view === 'table' && <CmpTable rows={rows} />}

        <hr className="divider" />
        <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }, { key: 'fbnc2025', page: 'p. 57, 60' }]} note="infrastructure-based (facilities · norms)" />
        <SourceNote refs={[{ key: 'nfhs6', page: 'inst. delivery' }, { key: 'nfhs5', page: 'LBW' }, { key: 'srs2024', page: 'NMR · CBR' }, { key: 'ncpProj', page: 'population' }]} note="epidemiological (LBW · NMR · births)" />
      </div>

      <div className="card">
        <h2>How to read the divergence</h2>
        <ul className="src-list" style={{ paddingLeft: 18 }}>
          <li><strong>Guidelines-based ≈ clinical need:</strong> the network is broadly right-sized — high confidence.</li>
          <li><strong>Guidelines-based &lt; clinical need</strong> (most states): an infrastructure/access gap; the normative lens shows the build-out to close it.</li>
          <li><strong>Guidelines-based &gt; clinical need:</strong> provision runs ahead of modelled need — a utilisation/right-sizing question.</li>
          <li>Both methods share the same births and are anchored to public (NHM) facilities; they differ only in what drives the requirement — infrastructure norms vs clinical epidemiology.</li>
        </ul>
      </div>
    </div>
  )
}
