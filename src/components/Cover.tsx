import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { STATES } from '../data/states'
import { STATES2, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE } from '../data/states2'
import { MNCU_TIERS, ALS_AMBULANCES } from '../data/forecastInputs'
import { computeAll } from '../engine/method1'
import type { Norms } from '../engine/method1'
import { computeAll2 } from '../engine/method2'
import type { M2Norms } from '../engine/method2'
import { computeM3 } from '../engine/method3'
import type { M3Norms } from '../engine/method3'
import { computePrivate } from '../engine/methodPrivate'
import type { PrivateNorms } from '../engine/methodPrivate'
import { deriveStarters } from '../engine/forecastSim'
import type { Place, TrackKey } from '../data/guide'
import { fmt } from '../utils/format'
import { ArrowRightIcon, BulbIcon, TourIcon } from './Icon'

// "Start here": the problem the tool answers, every approach with its live result, a short note on
// the forecast, how to find your way around, and the key terms. Written for readers who are new to
// the tool, in plain English.

const YEARS = 10 // the forecast's preset number of years

interface Props {
  m1: Norms
  m2: M2Norms
  m3: M3Norms
  mp: PrivateNorms
  mprv: M2Norms
  onOpen: (p: Place) => void
  onTour: (k: TrackKey) => void
}

interface Approach {
  name: string
  tab: string
  question: string
  how: string
  figure: string
  unit: string
  place: Place
  tour: TrackKey
}

function ApproachRow({ a, onOpen, onTour }: { a: Approach; onOpen: (p: Place) => void; onTour: (k: TrackKey) => void }) {
  return (
    <li className="approach">
      <div className="approach-name">
        <h4>{a.name}</h4>
        <span className="approach-tab">{a.tab}</span>
      </div>
      <div className="approach-text">
        <p><strong>The question.</strong> {a.question}</p>
        <p><strong>How it works.</strong> {a.how}</p>
      </div>
      <div className="approach-result">
        <span className={`approach-figure${a.figure.includes(' to ') ? ' range' : ''}`}>{a.figure}</span>
        <span className="approach-unit">{a.unit}</span>
      </div>
      <div className="approach-actions">
        <button type="button" className="cover-btn primary" onClick={() => onOpen(a.place)}>
          Open <ArrowRightIcon />
        </button>
        <button type="button" className="cover-btn" onClick={() => onTour(a.tour)}>
          <TourIcon /> Take the tour
        </button>
      </div>
    </li>
  )
}

function Aid({ demo, title, children }: { demo: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="aid">
      <div className="aid-demo" aria-hidden>{demo}</div>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  )
}

const TERMS: [string, string][] = [
  ['CPAP', 'Continuous positive airway pressure. A machine that gently pushes air into a newborn’s lungs to keep them open. It is the main treatment for newborns who struggle to breathe.'],
  ['RDS', 'Respiratory distress syndrome. A breathing problem common in babies born early, because their lungs are not yet fully developed.'],
  ['SNCU', 'Special newborn care unit. A unit for sick newborns, usually in a district hospital or medical college. The counts in this tool include NICUs.'],
  ['NBSU', 'Newborn stabilisation unit. A small unit, often at a community health centre, that stabilises sick newborns before they are sent on to an SNCU.'],
  ['MNCU', 'Mother-newborn care unit. A newborn unit where the mother stays with her sick baby. The first MNCUs are opening now.'],
  ['FBNC', 'Facility Based Newborn Care. The government’s operational guidelines for newborn care in health facilities. This tool uses the 2025 edition.'],
  ['DH, SDH, CHC', 'District hospital, sub-district hospital and community health centre: the levels of the public health system that conduct deliveries.'],
  ['LBW and NMR', 'Low birth weight (a baby born under 2.5 kg) and the newborn mortality rate (deaths in the first 28 days per 1,000 live births).'],
  ['Planning buffer', 'Extra machines added on top of an estimate. They cover busy periods, machines that break down, and the time it takes to order replacements. The preset is 25%.'],
  ['Devices in place and in use', 'Devices in place are the machines installed. Devices in use are the ones working and used, which is fewer because of staffing, spares and repairs.'],
]

export default function Cover({ m1, m2, m3, mp, mprv, onOpen, onTour }: Props) {
  const r = useMemo(() => {
    const guid = computeAll(STATES, m1, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE).totals.asisCpap
    const fac = computeM3(m3).totals.devices
    const rds = computeAll2(STATES2, m2).totals.gross
    const homes = computePrivate(mp).devices
    const prds = computeAll2(STATES2, mprv).totals.gross
    const base = {
      sncu: STATES.reduce((a, s) => a + s.sncu, 0),
      nbsu: STATES.reduce((a, s) => a + s.nbsu, 0),
      cpapPerSncu: m1.avgSncuBeds * m1.cpapPerBed * (1 + m1.buffer),
      mncuSites: m3.levels.filter((l) => MNCU_TIERS.includes(l.key)).reduce((a, l) => a + l.count, 0),
      alsAmbulances: ALS_AMBULANCES,
    }
    const starters = deriveStarters(base, YEARS, fac)
    return { guid, fac, rds, homes, prds, starters, publicLo: Math.min(guid, fac, rds), publicHi: Math.max(guid, fac, rds) }
  }, [m1, m2, m3, mp, mprv])

  const endYear = new Date().getFullYear() + YEARS
  const norm = m3.levels.find((l) => l.key === 'chc')
  const normTxt = norm ? (norm.beds * norm.cpapPerBed).toFixed(1) : '1.2'

  const PUBLIC: Approach[] = [
    {
      name: 'Guidelines-based current demand',
      tab: 'Demand Estimation (Public) › Guidelines-based',
      question: 'How many CPAP machines do the special newborn care units (SNCUs) that exist today need under the government’s FBNC 2025 guidelines?',
      how: 'It multiplies the number of SNCUs in each state by the average beds per SNCU and by the CPAP machines per bed. It then adds a 25% planning buffer.',
      figure: fmt(r.guid),
      unit: 'machines for today’s SNCUs',
      place: { section: 'estimation', sub: 'bu' },
      tour: 'bu',
    },
    {
      name: 'Epidemiological need: facility-based',
      tab: 'Demand Estimation (Public) › Epidemiological Need',
      question: 'How many CPAP machines would public hospitals need if each one were equipped to the FBNC norm for the deliveries it does?',
      how: `It counts the deliveries at district hospitals, government medical colleges, sub-district hospitals and community health centres, and applies the FBNC norm of ${normTxt} machines per 1,000 deliveries. Every sub-district hospital and community health centre gets at least one machine, and a 25% buffer is added.`,
      figure: fmt(r.fac),
      unit: 'machines for the public delivery network',
      place: { section: 'estimation', sub: 'td', td: 'facility' },
      tour: 'td-facility',
    },
    {
      name: 'Epidemiological need: RDS-based',
      tab: 'Demand Estimation (Public) › Epidemiological Need',
      question: 'How many CPAP machines do the newborns born in public facilities need?',
      how: 'It estimates how many of these newborns are likely to need CPAP, from how often RDS and similar breathing problems occur. It turns this into the machines in use on an average day, adds a 25% buffer, and shares the total among states by low birth weight and newborn deaths.',
      figure: fmt(r.rds),
      unit: 'machines for newborns in public facilities',
      place: { section: 'estimation', sub: 'td', td: 'rds' },
      tour: 'td-rds',
    },
    {
      name: 'Compare the public estimates',
      tab: 'Demand Estimation (Public) › Compare estimates',
      question: 'How far apart are the three public estimates, for India and for each state? How do they compare with the machines that six states report as installed?',
      how: 'It places the three public results side by side, and rates each state’s current demand against its need.',
      figure: `${fmt(r.publicLo)} to ${fmt(r.publicHi)}`,
      unit: 'range of the three public estimates',
      place: { section: 'estimation', sub: 'cmp' },
      tour: 'cmp',
    },
  ]
  const PRIVATE: Approach[] = [
    {
      name: 'Maternity homes',
      tab: 'Demand Estimation (Private) › Maternity homes',
      question: 'How many CPAP machines do private maternity homes need?',
      how: 'It counts private maternity homes in three size groups and gives each group a number of machines per home. There is no official count of these homes, so the numbers are assumptions that you can change.',
      figure: fmt(r.homes),
      unit: 'machines in private maternity homes',
      place: { section: 'private', sub: 'pvt', pvt: 'homes' },
      tour: 'pvt-homes',
    },
    {
      name: 'RDS prevalence (private)',
      tab: 'Demand Estimation (Private) › RDS prevalence',
      question: 'How many CPAP machines do the newborns born in private facilities need?',
      how: 'It uses the same steps as the public RDS-based approach, applied to births in private facilities. These are about 35% of all facility births in India.',
      figure: fmt(r.prds),
      unit: 'machines for newborns in private facilities',
      place: { section: 'private', sub: 'pvt', pvt: 'rds' },
      tour: 'pvt-rds',
    },
  ]

  const SCEN = [
    { name: 'Baseline', means: 'Today’s path. SNCUs keep growing at the past rate, and nothing new is added.', s: r.starters[0] },
    { name: 'Moderate expansion', means: 'Every factor moves part of the way to its top value, enough to close half the gap to the need.', s: r.starters[1] },
    { name: 'Accelerated', means: 'Every factor moves far enough for the machines in use to reach the need by the end year.', s: r.starters[2] },
  ]

  return (
    <div className="cover">
      <section className="cover-intro" aria-labelledby="cover-problem">
        <div className="cover-intro-top">
          <div className="cover-intro-main">
            <h2 id="cover-problem" className="cover-problem">
              Estimating how many CPAP machines India’s public and private health facilities need for newborns
            </h2>
            <div className="cover-prose">
              <p>
                <strong>What CPAP is.</strong> CPAP stands for continuous positive airway pressure. A CPAP machine gently pushes
                air into a newborn’s lungs to keep them open. It is the main treatment for newborns who struggle to breathe,
                especially babies born early. Many of these babies have respiratory distress syndrome (RDS).
              </p>
              <p>
                <strong>Why demand has to be estimated.</strong> Planners need to know how many machines facilities need today,
                and how many the public sector will need in the coming years. But there is no national count of the CPAP machines
                installed in India, and only six states have reported their numbers.
              </p>
              <p>
                <strong>What this tool does.</strong> It estimates demand in several independent ways, for India and for every
                state, so that the estimates can be checked against each other. It then forecasts public demand for the next 5 to
                12 years. Every number is worked out in your web browser from published data, and every assumption is shown,
                explained and can be changed.
              </p>
            </div>
          </div>
          <aside className="cover-start" aria-label="Where to begin">
            <h3>New to the tool?</h3>
            <p>Take the short tour first. It shows the main tabs, the inputs and results on each page, the yellow values and the bulbs.</p>
            <button type="button" className="cover-btn primary wide" onClick={() => onTour('around')}>
              <TourIcon /> Take the two-minute tour
            </button>
            <button type="button" className="cover-btn wide" onClick={() => onOpen({ section: 'estimation', sub: 'bu' })}>
              Go to the first approach <ArrowRightIcon />
            </button>
          </aside>
        </div>
      </section>

      <section className="cover-section" aria-labelledby="cover-approaches" data-tour="cover-approaches">
        <div className="cover-section-head">
          <h2 id="cover-approaches">Ways to estimate current demand</h2>
          <p>
            The tool uses five approaches. Three cover the public sector and two cover the private sector. They answer
            slightly different questions, so their results differ, and together they show the likely range. The figures
            below use the preset inputs, and they change if you change the inputs on a tab.
          </p>
        </div>
        <h3 className="cover-group">Public sector</h3>
        <ol className="approach-list">
          {PUBLIC.map((a) => <ApproachRow key={a.name} a={a} onOpen={onOpen} onTour={onTour} />)}
        </ol>
        <h3 className="cover-group">Private sector</h3>
        <p className="cover-group-note">
          The private sector is estimated apart from the public sector, because the government does not buy machines for
          private facilities.
        </p>
        <ol className="approach-list">
          {PRIVATE.map((a) => <ApproachRow key={a.name} a={a} onOpen={onOpen} onTour={onTour} />)}
        </ol>
      </section>

      <section className="cover-section" aria-labelledby="cover-forecast">
        <div className="cover-section-head">
          <h2 id="cover-forecast">Forecasting future demand</h2>
          <p>
            The forecast looks 5 to 12 years ahead, and 10 years by default. It starts from today’s SNCUs and NBSUs and
            moves seven factors: how fast SNCUs grow, CPAP at newborn stabilisation units (NBSUs), CPAP at mother-newborn
            care units (MNCUs), CPAP in ambulances, and the share of machines that are actually in use.
          </p>
          <p>
            Each year it counts the machines in place and the machines in use, and compares the machines in use with the
            public need from the facility-based approach ({fmt(r.fac)} machines). It tries 253,440 combinations of the factors
            to show the full range of results. It then picks three scenarios.
          </p>
        </div>
        <div className="table-scroll">
          <table className="data cover-scen">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>What it means</th>
                <th className="num">Machines in use in {endYear}</th>
                <th className="num">Share of the public need</th>
              </tr>
            </thead>
            <tbody>
              {SCEN.map(({ name, means, s }) => {
                const inUse = s.years[YEARS].effective
                return (
                  <tr key={name}>
                    <td className="cover-scen-name">{name}</td>
                    <td>{means}</td>
                    <td className="num cover-scen-fig">{fmt(inUse)}</td>
                    <td className="num">{Math.round((inUse / r.fac) * 100)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="cover-actions">
          <button type="button" className="cover-btn primary" onClick={() => onOpen({ section: 'forecasting', sub: 'fc' })}>
            Open the forecast <ArrowRightIcon />
          </button>
          <button type="button" className="cover-btn" onClick={() => onTour('fc')}>
            <TourIcon /> Take the tour
          </button>
        </div>
      </section>

      <section className="cover-section" aria-labelledby="cover-help">
        <div className="cover-section-head">
          <h2 id="cover-help">How to find your way</h2>
          <p>Every approach page works the same way, with the same help built in.</p>
        </div>
        <div className="aids">
          <Aid title="Inputs on the left, results on the right" demo={<span className="aid-cols"><span /><span /></span>}>
            Each approach has two columns. On the left, the inputs are grouped into numbered steps that you open one at a
            time. On the right, the results update as soon as you change an input.
          </Aid>
          <Aid title="Yellow values in each calculation" demo={<span className="io-pill demo">16 beds</span>}>
            Each result has a breakdown that shows how it is worked out, with the real numbers. A yellow value is an input
            you can change: click it, and the tool takes you to that input on the left.
          </Aid>
          <Aid
            title="Yellow and green inputs"
            demo={
              <span className="aid-badges">
                <span className="aid-in preset">16</span>
                <span className="aid-in edited">18</span>
              </span>
            }
          >
            Every input starts at a preset value in yellow, from a published source or a stated assumption. It turns green
            when you change it, and Reset all brings back the presets. Your changes stay until you reload the page, and
            nothing you enter leaves your computer.
          </Aid>
          <Aid title="Bulbs and guided tours" demo={<span className="explain-btn"><BulbIcon /></span>}>
            Click a bulb beside a result to read what it shows. A guided tour walks you through an approach one part at a
            time: start one from Guided tour at the top, or from Tour this page. Switch Guides off to hide the bulbs and the
            “What to do” notes when you present.
          </Aid>
        </div>
      </section>

      <section className="cover-section" aria-labelledby="cover-terms">
        <div className="cover-section-head">
          <h2 id="cover-terms">Key terms</h2>
        </div>
        <dl className="terms">
          {TERMS.map(([t, d]) => (
            <div key={t} className="term">
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
        <p className="cover-foot">
          These are planning estimates based on published data and stated assumptions. They are not a count of the machines
          in facilities. Each page lists its sources, with links to the original documents. Prepared by WJCF.
        </p>
      </section>
    </div>
  )
}
