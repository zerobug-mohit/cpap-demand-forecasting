import { useMemo, useState } from 'react'
import type { Norms } from '../engine/method1'
import { computeAll } from '../engine/method1'
import type { M2Norms } from '../engine/method2'
import { computeAll2 } from '../engine/method2'
import type { M3Norms } from '../engine/method3'
import { computeM3 } from '../engine/method3'
import type { PrivateNorms } from '../engine/methodPrivate'
import { computePrivate } from '../engine/methodPrivate'
import { STATES } from '../data/states'
import { STATES2, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE } from '../data/states2'
import { compare } from '../engine/compare'
import { fmt } from '../utils/format'
import CmpScatter from './CmpScatter'
import CmpMap from './CmpMap'
import CmpTable from './CmpTable'
import SourceNote from './SourceNote'

interface Props {
  m1: Norms
  m2: M2Norms
  m3: M3Norms
  mp: PrivateNorms
  mprv: M2Norms
}

type View = 'scatter' | 'map' | 'table'

const INSTALLED_COLOR = '#2e8b57'

interface Bar {
  label: string
  sub: string
  value: number
  color: string
}

interface Group {
  title: string
  bars: Bar[]
}

function BarChart({ groups, max }: { groups: Group[]; max: number }) {
  const pct = (v: number) => `${Math.max(1.5, (v / max) * 100)}%`
  return (
    <div style={{ marginTop: 8 }}>
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ margin: '0 0 8px' }}>{g.title}</div>
          <div className="fc-bars" style={{ marginBottom: 0 }}>
            {g.bars.map((b) => (
              <div className="fc-barrow" key={b.label} style={{ gridTemplateColumns: '220px 1fr 64px' }}>
                <span className="fc-bname" title={b.sub}>
                  {b.label}
                  <span style={{ display: 'block', fontWeight: 400, fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>{b.sub}</span>
                </span>
                <span className="fc-track"><span className="fc-fill" style={{ width: pct(b.value), background: b.color }} /></span>
                <span className="fc-bval fc-num">{fmt(b.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Comparison({ m1, m2, m3, mp, mprv }: Props) {
  const { rows } = useMemo(() => compare(m1, m2), [m1, m2])
  const [view, setView] = useState<View>('scatter')

  const est = useMemo(() => {
    const guidCurrent = computeAll(STATES, m1, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE).totals.asisCpap
    const idealFacility = computeM3(m3).totals.devices
    const idealRds = computeAll2(STATES2, m2).totals.gross
    const privHomes = computePrivate(mp).devices
    const privRds = computeAll2(STATES2, mprv).totals.gross
    const installed = STATES.reduce((a, s) => a + (s.installed ?? 0), 0)
    return { guidCurrent, idealFacility, idealRds, privHomes, privRds, installed }
  }, [m1, m2, m3, mp, mprv])

  const pubNeedLo = Math.min(est.idealFacility, est.idealRds)
  const pubNeedHi = Math.max(est.idealFacility, est.idealRds)
  const privLo = Math.min(est.privHomes, est.privRds)
  const privHi = Math.max(est.privHomes, est.privRds)
  const totalLo = pubNeedLo + privLo
  const totalHi = pubNeedHi + privHi
  const range = (a: number, b: number) => (a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`)

  const groups: Group[] = [
    {
      title: 'Public (NHM) demand',
      bars: [
        { label: 'Guidelines-based · current demand', sub: 'existing SNCU network × FBNC norm', value: est.guidCurrent, color: 'var(--c-asis)' },
        { label: 'Epidemiological need · facility-based', sub: 'public deliveries × FBNC norm', value: est.idealFacility, color: 'var(--c-primary-dark)' },
        { label: 'Epidemiological need · RDS prevalence', sub: 'RDS × correction, public share', value: est.idealRds, color: 'var(--c-primary-bright)' },
      ],
    },
    {
      title: 'Private-sector demand (outside NHM)',
      bars: [
        { label: 'Private · maternity homes', sub: 'nursing homes × size tiers', value: est.privHomes, color: 'var(--c-accent)' },
        { label: 'Private · RDS prevalence', sub: 'RDS × correction, private share', value: est.privRds, color: 'var(--c-accent-dark)' },
      ],
    },
    {
      title: 'Reference · reported devices',
      bars: [
        { label: 'Installed (actual)', sub: 'reported states only — not national', value: est.installed, color: INSTALLED_COLOR },
      ],
    },
  ]

  const max = Math.max(1, ...groups.flatMap((g) => g.bars.map((b) => b.value)))

  return (
    <div>
      <div className="card lens-explainer">
        <h2>All current estimates compared</h2>
        <p className="card-note">
          Every method now in the tool, at national scale — what the <strong>existing</strong> public network is equipped
          for, two independent <strong>epidemiological-need</strong> estimates for the public system, and the <strong>private</strong>
          market (two ways), plus reported installed devices as a reality check.
        </p>
        <BarChart groups={groups} max={max} />

        <div className="kpi-row" style={{ marginTop: 16 }}>
          <div className="kpi accent-teal">
            <div className="kpi-label">Public · current infra</div>
            <div className="kpi-value">{fmt(est.guidCurrent)}</div>
            <div className="kpi-sub">guidelines-based, today's SNCUs</div>
          </div>
          <div className="kpi accent-navy">
            <div className="kpi-label">Public · epidemiological need</div>
            <div className="kpi-value" style={{ fontSize: '1.35rem' }}>{range(pubNeedLo, pubNeedHi)}</div>
            <div className="kpi-sub">RDS-based ↔ facility-based</div>
          </div>
          <div className="kpi accent-bad">
            <div className="kpi-label">Private-sector demand</div>
            <div className="kpi-value" style={{ fontSize: '1.35rem' }}>{range(privLo, privHi)}</div>
            <div className="kpi-sub">RDS-based ↔ maternity homes</div>
          </div>
          <div className="kpi accent-good">
            <div className="kpi-label">Total system demand</div>
            <div className="kpi-value" style={{ fontSize: '1.35rem' }}>{range(totalLo, totalHi)}</div>
            <div className="kpi-sub">public need + private</div>
          </div>
        </div>

        <div className="lens-gap-note" style={{ marginTop: 16 }}>
          India's current public SNCU network is equipped for about <strong>{fmt(est.guidCurrent)}</strong> CPAP devices
          (guidelines-based, current infra). The two independent epidemiological-need estimates put public need at{' '}
          <strong>{range(pubNeedLo, pubNeedHi)}</strong> — a build-out gap of roughly{' '}
          <strong>{fmt(Math.max(0, pubNeedHi - est.guidCurrent))}</strong> above what exists today. The private sector adds
          another <strong>{range(privLo, privHi)}</strong> (outside NHM procurement), so total system demand is about{' '}
          <strong>{range(totalLo, totalHi)}</strong> devices. Installed actuals are reported for only a handful of states
          (<strong>{fmt(est.installed)}</strong> so far) and are <em>not</em> a national total.
        </div>

        <hr className="divider" />
        <SourceNote refs={[{ key: 'mohfwAR', page: 'p. 62' }, { key: 'fbnc2025', page: 'p. 28, 57–60' }]} note="guidelines-based · facility-based (facilities · FBNC norm)" />
        <SourceNote refs={[{ key: 'rdsRecent', page: '25.3/1,000' }, { key: 'nfhs6', page: 'inst. delivery · public share' }, { key: 'srs2024', page: 'NMR · CBR' }]} note="RDS-based (public & private share)" />
        <SourceNote refs={[{ key: 'indiaHospEco', page: 'nursing homes' }, { key: 'manyata', page: 'size mix' }]} note="private · maternity homes" />
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 6 }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>By state · public methods</h2>
            <p className="card-note" style={{ margin: 0 }}>
              The two state-resolved public estimates — <strong>current infra-based</strong> vs <strong>RDS-based
              epidemiological need</strong> — by state, with installed actuals where reported. (Facility-based and private estimates are
              national, so they aren't split by state here.)
            </p>
          </div>
        </div>
        <div className="explorer-head">
          <div className="toggle-group" role="tablist" aria-label="View">
            {(['scatter', 'map', 'table'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                {v === 'scatter' ? 'Scatter' : v === 'map' ? 'Map' : 'Table'}
              </button>
            ))}
          </div>
        </div>

        {view === 'scatter' && <CmpScatter rows={rows} lens="existing" />}
        {view === 'map' && <CmpMap rows={rows} lens="existing" />}
        {view === 'table' && <CmpTable rows={rows} />}
      </div>

      <div className="card">
        <h2>How to read it</h2>
        <ul className="src-list" style={{ paddingLeft: 18 }}>
          <li><strong>Current infra vs epidemiological need:</strong> the gap between what the existing network is equipped for and what need implies is the public build-out headroom.</li>
          <li><strong>Two epidemiological-need estimates:</strong> facility-based (deliveries × FBNC norm) and RDS-based (prevalence) are independent — treat their spread as an uncertainty band, not a single point.</li>
          <li><strong>Public vs private:</strong> only the public estimates are in NHM procurement scope; the private figures size the wider market and are shown separately.</li>
          <li><strong>Installed (actual):</strong> reported for only a few states — a reality check on the current-infra estimate, not a national number.</li>
        </ul>
      </div>
    </div>
  )
}
