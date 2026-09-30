import { useMemo, useState } from 'react'
import type { Norms } from '../engine/method1'
import type { M2Norms } from '../engine/method2'
import type { M3Norms } from '../engine/method3'
import { compare } from '../engine/compare'
import type { CmpRow } from '../engine/compare'
import { fmt, fmtPct } from '../utils/format'
import CmpScatter from './CmpScatter'
import CmpMap from './CmpMap'
import CmpTable from './CmpTable'
import SourceNote from './SourceNote'

interface Props {
  m1: Norms
  m2: M2Norms
  m3: M3Norms
}

type View = 'scatter' | 'map' | 'table'
type NeedBasis = 'rds' | 'facility'

const INSTALLED_COLOR = '#2e8b57'

interface Bar { key: string; label: string; sub: string; value: number; color: string }

function Bars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div className="fc-bars" style={{ marginTop: 12 }}>
      {bars.map((b) => (
        <div className="fc-barrow" key={b.key} style={{ gridTemplateColumns: '230px 1fr 66px' }}>
          <span className="fc-bname">
            {b.label}
            <span style={{ display: 'block', fontWeight: 400, fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>{b.sub}</span>
          </span>
          <span className="fc-track"><span className="fc-fill" style={{ width: `${Math.max(1.5, (b.value / max) * 100)}%`, background: b.color }} /></span>
          <span className="fc-bval fc-num">{fmt(b.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Comparison({ m1, m2, m3 }: Props) {
  const { rows, nat } = useMemo(() => compare(m1, m2, m3), [m1, m2, m3])
  const [scope, setScope] = useState('national')
  const [needBasis, setNeedBasis] = useState<NeedBasis>('rds')
  const [view, setView] = useState<View>('scatter')

  const sortedStates = useMemo(() => rows.map((r) => r.state).sort((a, b) => a.localeCompare(b)), [rows])
  const sel = scope === 'national' ? null : rows.find((r) => r.state === scope) ?? null

  const active = {
    guid: sel ? sel.buExisting : nat.buExisting,
    rds: sel ? sel.td : nat.td,
    fac: sel ? sel.tdFacility : nat.tdFacility,
    installed: sel ? (sel.installed ?? null) : nat.installed,
  }
  const needLo = Math.min(active.rds, active.fac)
  const needHi = Math.max(active.rds, active.fac)
  const needMid = (active.rds + active.fac) / 2
  const coverage = needMid > 0 ? active.guid / needMid : 0
  const scopeName = sel ? sel.state : 'India (national)'

  const bars: Bar[] = [
    { key: 'guid', label: 'Guidelines-based · current demand', sub: 'existing SNCU network × FBNC norm', value: active.guid, color: 'var(--c-asis)' },
    { key: 'rds', label: 'Epidemiological need · RDS prevalence', sub: 'RDS × correction, public share', value: active.rds, color: 'var(--c-primary-bright)' },
    { key: 'fac', label: 'Epidemiological need · facility-based', sub: 'public deliveries × FBNC norm', value: active.fac, color: 'var(--c-primary-dark)' },
    ...(active.installed != null && active.installed > 0
      ? [{ key: 'installed', label: 'Installed (actual)', sub: sel ? 'reported for this state' : 'reported states only — partial', value: active.installed, color: INSTALLED_COLOR }]
      : []),
  ]

  // cross-state chart rows: swap the "need" (td) to the chosen basis so the existing chart components work unchanged
  const chartRows: CmpRow[] = useMemo(
    () => rows.map((r) => ({ ...r, td: needBasis === 'facility' ? r.tdFacility : r.td })),
    [rows, needBasis],
  )
  const needLabel = needBasis === 'facility' ? 'facility-based' : 'RDS-based'

  return (
    <div>
      <div className="card lens-explainer">
        <div className="cmp-scope">
          <label htmlFor="cmp-scope-sel">Scope</label>
          <select id="cmp-scope-sel" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="national">India (national)</option>
            {sortedStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <h2>Demand by approach — {scopeName}</h2>
        <p className="card-note">
          The public CPAP estimates side by side for the selected scope — what the current network is equipped for
          (guidelines-based) and two independent readings of epidemiological need — with the actual installed count where
          it has been reported. (Private-sector demand is on its own tab and excluded here.)
        </p>
        <Bars bars={bars} />

        <div className="kpi-row" style={{ marginTop: 16 }}>
          <div className="kpi accent-teal">
            <div className="kpi-label">Current demand</div>
            <div className="kpi-value">{fmt(active.guid)}</div>
            <div className="kpi-sub">guidelines-based, today's SNCUs</div>
          </div>
          <div className="kpi accent-navy">
            <div className="kpi-label">Epidemiological need</div>
            <div className="kpi-value" style={{ fontSize: '1.35rem' }}>{needLo === needHi ? fmt(needLo) : `${fmt(needLo)} – ${fmt(needHi)}`}</div>
            <div className="kpi-sub">RDS-based ↔ facility-based</div>
          </div>
          <div className="kpi accent-good">
            <div className="kpi-label">Installed (actual)</div>
            <div className="kpi-value">{active.installed != null && active.installed > 0 ? fmt(active.installed) : '—'}</div>
            <div className="kpi-sub">{sel ? (active.installed != null && active.installed > 0 ? 'reported for this state' : 'not reported') : 'reported states only'}</div>
          </div>
          <div className="kpi accent-bad">
            <div className="kpi-label">Coverage of need</div>
            <div className="kpi-value">{fmtPct(coverage)}</div>
            <div className="kpi-sub">current ÷ mean epidemiological need</div>
          </div>
        </div>

        <div className="lens-gap-note" style={{ marginTop: 16 }}>
          <strong>{scopeName}</strong>: the current SNCU network is equipped for about <strong>{fmt(active.guid)}</strong>{' '}
          CPAP devices (guidelines-based). Epidemiological need is <strong>{needLo === needHi ? fmt(needLo) : `${fmt(needLo)}–${fmt(needHi)}`}</strong>{' '}
          (RDS-based ↔ facility-based) — a build-out gap of roughly <strong>{fmt(Math.max(0, needHi - active.guid))}</strong>{' '}
          above what exists today.{' '}
          {active.installed != null && active.installed > 0
            ? <>Actual installed: <strong style={{ color: INSTALLED_COLOR }}>{fmt(active.installed)}</strong>
              {!sel && ' (a handful of reporting states only — not a national figure)'}.</>
            : 'No installed count is reported for this scope.'}
        </div>

        <hr className="divider" />
        <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }, { key: 'fbnc2025', page: 'p. 28, 57–60' }, { key: 'healthDynamics', page: 'Tables 6–7' }]} note="guidelines-based · facility-based (facilities · FBNC norm)" />
        <SourceNote refs={[{ key: 'rdsRecent', page: '25.3/1,000' }, { key: 'nfhs6', page: 'inst. delivery · public share' }, { key: 'srs2024', page: 'NMR · CBR' }]} note="RDS-based epidemiological need" />
      </div>

      <div className="card">
        <div className="explorer-head">
          <div>
            <h2 style={{ marginBottom: 2 }}>By state · current demand vs need</h2>
            <p className="card-note" style={{ margin: 0 }}>
              Every state at once — guidelines-based current demand against the {needLabel} epidemiological need, with
              installed actuals where reported.
            </p>
          </div>
        </div>
        <div className="explorer-head" style={{ marginTop: 10 }}>
          <div className="toggle-group" role="tablist" aria-label="View">
            {(['scatter', 'map', 'table'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                {v === 'scatter' ? 'Bubble regression' : v === 'map' ? 'Map' : 'Table'}
              </button>
            ))}
          </div>
          <div className="explorer-controls">
            <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Need basis</span>
            <div className="series-toggle">
              <button className={needBasis === 'rds' ? 'on asis' : ''} onClick={() => setNeedBasis('rds')}>RDS prevalence</button>
              <button className={needBasis === 'facility' ? 'on norm' : ''} onClick={() => setNeedBasis('facility')}>Facility-based</button>
            </div>
          </div>
        </div>

        {view === 'scatter' && <CmpScatter rows={chartRows} lens="existing" />}
        {view === 'map' && <CmpMap rows={chartRows} lens="existing" />}
        {view === 'table' && <CmpTable rows={chartRows} />}
      </div>

      <div className="card">
        <h2>How to read it</h2>
        <ul className="src-list" style={{ paddingLeft: 18 }}>
          <li><strong>Current demand vs need:</strong> the gap between what the existing SNCU network is equipped for (guidelines-based) and what epidemiological need implies is the public build-out headroom.</li>
          <li><strong>Two need estimates:</strong> RDS prevalence and facility-based (deliveries × FBNC norm) are independent — treat their spread as an uncertainty band, and switch the bubble/map/table between them with the need-basis toggle.</li>
          <li><strong>Installed (actual):</strong> reported for only a few states — a reality check on the current-demand estimate, not a national number.</li>
          <li>Private-sector demand is deliberately excluded here; it is estimated separately on the Private sector Demand tab.</li>
        </ul>
      </div>
    </div>
  )
}
