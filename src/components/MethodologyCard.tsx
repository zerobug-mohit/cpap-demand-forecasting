import { SOURCES } from '../data/sources'
import type { SourceKey } from '../data/sources'

const SRC_LIST: { key: SourceKey; page?: string; what: string }[] = [
  { key: 'fbnc2025', page: 'p. 57–60', what: 'CPAP norm (~30% of SNCU beds), bed & establishment norms' },
  { key: 'iphs2022', page: 'p. 64', what: 'SNCU/NICU bed schedule & nurse:bed ratios' },
  { key: 'inap2014', page: 'p. 57', what: 'facility establishment norms' },
  { key: 'mohfwAR', page: 'p. 62', what: 'state-wise facility units (as on Oct 2024)' },
  { key: 'srs2024', page: 'Statement 14', what: 'birth rate, used to work out live births (shown as background context)' },
  { key: 'nfhs6', page: 'inst. delivery', what: 'share of births that happen in a facility (shown as background context)' },
  { key: 'ncpProj', page: 'p. 50', what: 'projected population, used to work out live births' },
  { key: 'nhmSncu2013', page: 'p. 6', what: 'average beds per SNCU (~16)' },
  { key: 'sncuOnline', what: 'facility beds / installed CPAP (login-only)' },
]

export default function MethodologyCard() {
  return (
    <div className="card">
      <h2>How it works &amp; sources</h2>
      <p className="card-note">This tab uses the guidelines-based method, which works from the facilities that exist and the government norms.</p>

      <div className="section-label">How the number is worked out</div>
      <p style={{ fontSize: '0.86rem', marginTop: 0 }}>
        For each state we take the number of SNCUs, multiply it by the average number of beds per SNCU to get the total
        beds, and then apply the FBNC norm for how many of those beds should have a CPAP machine (about 30%). We add this
        up across all 36 states and union territories to get the national total. We then add a 25% planning buffer for
        busy periods, machines wearing out, and the time needed to order replacements. Under FBNC, NBSUs and NBCCs do not
        carry CPAP machines unless you turn on the optional add-on scope.
        <br /><br />
        This tab shows what the network that <strong>exists today</strong> should have. To estimate how many machines
        newborns actually <em>need</em>, including in areas that have no SNCU yet, use the{' '}
        <strong>Epidemiological need</strong> tab.
      </p>

      <hr className="divider" />
      <div className="section-label">Sources (click any link to check the original)</div>
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
        Prepared by WJCF. These are planning estimates based on norms, not a count of the equipment actually in facilities.
      </p>
    </div>
  )
}
