import { SOURCES } from '../data/sources'
import type { SourceKey } from '../data/sources'

const SRC_LIST: { key: SourceKey; page?: string; what: string }[] = [
  { key: 'fbnc2025', page: 'p. 57–60', what: 'CPAP norm (~30% of SNCU beds), bed & establishment norms' },
  { key: 'iphs2022', page: 'p. 64', what: 'SNCU/NICU bed schedule & nurse:bed ratios' },
  { key: 'inap2014', page: 'p. 57', what: 'facility establishment norms' },
  { key: 'mohfwAR', page: 'p. 62', what: 'state-wise facility units (as on Oct 2024)' },
  { key: 'srs2024', page: 'Statement 14', what: 'crude birth rate → live births' },
  { key: 'ncpProj', page: 'p. 50', what: 'projected population' },
  { key: 'nhmSncu2013', page: 'p. 6', what: 'average beds per SNCU (~16)' },
  { key: 'sncuOnline', what: 'facility beds / installed CPAP (login-only)' },
]

export default function MethodologyCard() {
  return (
    <div className="card">
      <h2>Methodology &amp; sources</h2>
      <p className="card-note">Infrastructure-based method — facility &amp; norms.</p>

      <div className="section-label">The calculation</div>
      <p style={{ fontSize: '0.86rem', marginTop: 0 }}>
        <strong>Guidelines-based:</strong> SNCU beds (units × avg beds) × CPAP-per-bed norm.
        <br />
        <strong>Normative:</strong> (live births ÷ 1,000 × norm beds) × CPAP-per-bed norm.
        <br />
        Summed across 36 states/UTs to a national total. NBSU &amp; NBCC carry no CPAP under FBNC.
      </p>

      <hr className="divider" />
      <div className="section-label">Sources (click to verify)</div>
      <ul className="src-list linked">
        {SRC_LIST.map(({ key, page, what }) => (
          <li key={key}>
            <a href={SOURCES[key].url} target="_blank" rel="noopener noreferrer">
              {SOURCES[key].label}
              {page ? ` (${page})` : ''}
              <span className="src-ext" aria-hidden> ↗</span>
            </a>{' '}
            — {what}
          </li>
        ))}
      </ul>
      <p className="muted" style={{ fontSize: '0.72rem', marginTop: 10, marginBottom: 0 }}>
        Prepared by WJCF · figures are norm-based estimates for planning, not a facility asset census.
      </p>
    </div>
  )
}
