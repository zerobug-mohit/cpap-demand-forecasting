import { SOURCES } from '../data/sources'
import { ExplainTitle } from './Explain'
import type { SourceKey } from '../data/sources'

const SRC_LIST: { key: SourceKey; page?: string; what: string }[] = [
  { key: 'fbnc2025', page: 'p. 57 to 60', what: 'the CPAP norm (about 30% of SNCU beds) and the norms for beds and for setting up units' },
  { key: 'iphs2022', page: 'p. 64', what: 'SNCU and NICU bed norms and nurse-to-bed ratios' },
  { key: 'inap2014', page: 'p. 57', what: 'norms for setting up facilities' },
  { key: 'mohfwAR', page: 'p. 62', what: 'the number of units in each state (as on Oct 2024)' },
  { key: 'srs2024', page: 'Statement 14', what: 'the birth rate, used to work out live births (shown for background only)' },
  { key: 'nfhs6', page: 'institutional delivery', what: 'the share of births that happen in a facility (shown for background only)' },
  { key: 'ncpProj', page: 'p. 50', what: 'the projected population, used to work out live births' },
  { key: 'nhmSncu2013', page: 'p. 6', what: 'the average beds per SNCU (about 16)' },
  { key: 'sncuOnline', what: 'facility beds and installed CPAP (you need a login to see these)' },
]

export default function MethodologyCard() {
  return (
    <div className="card" data-step="bu-sources">
      <ExplainTitle id="bu-sources">How it works &amp; sources</ExplainTitle>
      <p className="card-note">This tab uses the guidelines-based method. It starts from the facilities that exist today and applies the government norms.</p>

      <div className="section-label">How the number is worked out</div>
      <p style={{ fontSize: '0.86rem', marginTop: 0 }}>
        For each state, we multiply the number of SNCUs by the average number of beds per SNCU to get the total beds.
        We then apply the FBNC norm for how many of those beds should have a CPAP machine (about 30%). We add up the
        results for all 36 states and union territories to get the national total. Then we add a planning buffer (25% by default)
        to cover busy periods, machines wearing out, and the time needed to order replacements. FBNC does not provide
        CPAP machines for NBSUs and NBCCs, so the estimate counts SNCUs only.
        <br /><br />
        This tab shows what the facilities that <strong>exist today</strong> should have. To estimate how many machines
        newborns actually <em>need</em>, including in areas that have no SNCU yet, use the{' '}
        <strong>Epidemiological Need</strong> tab.
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
            </a>
            : {what}
          </li>
        ))}
      </ul>
      <p className="muted" style={{ fontSize: '0.72rem', marginTop: 10, marginBottom: 0 }}>
        Prepared by WJCF. These are planning estimates based on norms. They are not a count of the equipment actually
        in facilities.
      </p>
    </div>
  )
}
