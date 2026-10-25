import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import Cover from './components/Cover'
import TourOverlay from './components/TourOverlay'
import { Guides } from './components/Explain'
import { ApproachSwitch, PageTour, openIoStep } from './components/io/Io'
import GuidelinesPage from './components/pages/GuidelinesPage'
import FacilityPage from './components/pages/FacilityPage'
import RdsPage from './components/pages/RdsPage'
import HomesPage from './components/pages/HomesPage'
import ComparePage from './components/pages/ComparePage'
import Forecast from './components/Forecast'

import { DEFAULT_NORMS } from './engine/method1'
import type { Norms } from './engine/method1'
import { DEFAULT_M2, DEFAULT_M2_PRIVATE } from './engine/method2'
import type { M2Norms } from './engine/method2'
import { DEFAULT_M3 } from './engine/method3'
import type { M3Norms } from './engine/method3'
import { DEFAULT_PRIVATE } from './engine/methodPrivate'
import type { PrivateNorms } from './engine/methodPrivate'
import { pageOf, trackOf } from './data/guide'
import type { Place, PvtApproach, Section, TdApproach, TrackKey } from './data/guide'

type ToolSection = Exclude<Section, 'start'>

interface Tab {
  key: string
  label: string
}

const SUBS: Record<ToolSection, Tab[]> = {
  estimation: [
    { key: 'bu', label: 'Guidelines-based current demand' },
    { key: 'td', label: 'Epidemiological Need' },
    { key: 'cmp', label: 'Compare estimates' },
  ],
  forecasting: [{ key: 'fc', label: 'Forecast' }],
  private: [{ key: 'pvt', label: 'Private sector demand' }],
}

const PRIMARY: { key: Section; label: string; num?: string }[] = [
  { key: 'start', label: 'Start here' },
  { key: 'estimation', label: 'CPAP Demand Estimation (Public)', num: '01' },
  { key: 'forecasting', label: 'CPAP Demand Forecasting (Public)', num: '02' },
  { key: 'private', label: 'CPAP Demand Estimation (Private)', num: '03' },
]

const TD_OPTIONS: { key: TdApproach; label: string }[] = [
  { key: 'rds', label: 'RDS prevalence' },
  { key: 'facility', label: 'Deliveries × FBNC norms' },
]
const PVT_OPTIONS: { key: PvtApproach; label: string }[] = [
  { key: 'homes', label: 'Maternity homes' },
  { key: 'rds', label: 'RDS prevalence (private)' },
]

// TRIAL: designs for the Output column's section containers (styles/sections.css). Remove once one is chosen.
const SEC_DESIGNS = [
  { key: '', label: 'Current' },
  { key: 'band', label: 'Navy band' },
  { key: 'frame', label: 'Framed' },
  { key: 'tab', label: 'Saffron tab' },
]
const SEC_KEY = 'cpap-sec-trial'

// The Guides switch is a viewer's own preference, so it is remembered in this browser when it can be.
const GUIDES_KEY = 'cpap-guides'
function readGuides(): boolean {
  try {
    return localStorage.getItem(GUIDES_KEY) !== 'off'
  } catch {
    return true
  }
}

export default function App() {
  const [section, setSection] = useState<Section>('start')
  const [sub, setSub] = useState<Record<ToolSection, string>>({ estimation: 'bu', forecasting: 'fc', private: 'pvt' })
  const [td, setTd] = useState<TdApproach>('rds')
  const [pvt, setPvt] = useState<PvtApproach>('homes')
  const [m1, setM1] = useState<Norms>(DEFAULT_NORMS)
  const [m2, setM2] = useState<M2Norms>(DEFAULT_M2)
  const [m3, setM3] = useState<M3Norms>(DEFAULT_M3)
  const [mp, setMp] = useState<PrivateNorms>(DEFAULT_PRIVATE)
  const [mprv, setMprv] = useState<M2Norms>(DEFAULT_M2_PRIVATE)
  const [guidesOn, setGuidesOn] = useState(readGuides)
  const [tour, setTour] = useState<{ key: TrackKey; index: number } | null>(null)
  const [sec, setSec] = useState(() => {
    try {
      return localStorage.getItem(SEC_KEY) ?? ''
    } catch {
      return ''
    }
  })
  useEffect(() => {
    if (sec) document.documentElement.dataset.sec = sec
    else delete document.documentElement.dataset.sec
    try {
      localStorage.setItem(SEC_KEY, sec)
    } catch {
      /* the trial still works for this visit */
    }
  }, [sec])

  const activeSub = section === 'start' ? undefined : sub[section]
  const page = pageOf({ section, sub: activeSub, td, pvt })

  const goTo = useCallback((p: Place) => {
    setSection(p.section)
    if (p.section !== 'start' && p.sub) setSub((s) => ({ ...s, [p.section]: p.sub as string }))
    if (p.td) setTd(p.td)
    if (p.pvt) setPvt(p.pvt)
  }, [])

  const open = (p: Place) => {
    goTo(p)
    window.scrollTo({ top: 0 })
  }

  const setGuides = (on: boolean) => {
    setGuidesOn(on)
    try {
      localStorage.setItem(GUIDES_KEY, on ? 'on' : 'off')
    } catch {
      /* private window or blocked storage: the switch still works for this visit */
    }
  }

  // A tour step can move the app to another page, and open an input step there, before it points at something.
  const track = tour ? trackOf(tour.key) : null
  useEffect(() => {
    if (!tour) return
    const t = trackOf(tour.key)
    const step = t.steps[tour.index]
    goTo(step.place ?? t.place)
    if (!step.scope || !step.open) return
    // the page may still be mounting (the forecast takes a moment), so ask twice
    const timers = [80, 450].map((ms) => window.setTimeout(() => openIoStep(step.scope!, step.open!), ms))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [tour, goTo])

  const startTour = (key: TrackKey) => setTour({ key, index: 0 })
  const endTour = useCallback(() => setTour(null), [])
  const nextStep = useCallback(
    () => setTour((t) => (t && t.index < trackOf(t.key).steps.length - 1 ? { ...t, index: t.index + 1 } : null)),
    [],
  )
  const prevStep = useCallback(() => setTour((t) => (t && t.index > 0 ? { ...t, index: t.index - 1 } : t)), [])

  const tdSwitch = (
    <ApproachSwitch label="Approach" options={TD_OPTIONS} value={td} onChange={setTd}
      note={td === 'rds'
        ? 'Starts from newborns: how many born in public facilities are likely to need CPAP, from how often RDS occurs.'
        : 'Starts from facilities: the deliveries at public hospitals, and the FBNC norm for machines per 1,000 deliveries.'} />
  )
  const pvtSwitch = (
    <ApproachSwitch label="Approach" options={PVT_OPTIONS} value={pvt} onChange={setPvt}
      note={pvt === 'homes'
        ? 'Counts private maternity homes by size, and the machines each one should have.'
        : 'Applies the RDS-based approach to births in private facilities, about 35% of all facility births.'} />
  )

  const content = (() => {
    if (section === 'start') return <Cover m1={m1} m2={m2} m3={m3} mp={mp} mprv={mprv} onOpen={open} onTour={startTour} />
    if (section === 'estimation') {
      if (activeSub === 'bu') return <GuidelinesPage key="bu" norms={m1} onChange={setM1} />
      if (activeSub === 'td') {
        return td === 'facility'
          ? <FacilityPage key="fac" norms={m3} onChange={setM3} top={tdSwitch} />
          : <RdsPage key="rds" norms={m2} onChange={setM2} top={tdSwitch} />
      }
      return <ComparePage key="cmp" m1={m1} m2={m2} m3={m3} onOpen={open} />
    }
    if (section === 'private') {
      return pvt === 'homes'
        ? <HomesPage key="homes" norms={mp} onChange={setMp} top={pvtSwitch} />
        : <RdsPage key="prds" norms={mprv} onChange={setMprv} top={pvtSwitch} />
    }
    return <Forecast key="fc" m1={m1} m3={m3} />
  })()

  const io = section !== 'start'
  return (
    <div className={`app${io ? ' app-io' : ''}`}>
      <Header guidesOn={guidesOn} onGuides={setGuides} onTour={startTour} />

      <nav className="app-nav" aria-label="Main tabs">
        <div className="app-nav-inner">
          <div className="nav-primary" data-tour="nav-primary">
            {PRIMARY.map((p) => (
              <button key={p.key} className={section === p.key ? 'active' : ''} aria-current={section === p.key ? 'page' : undefined}
                onClick={() => { setSection(p.key); window.scrollTo({ top: 0 }) }}>
                {p.num && <span className="nav-num">{p.num}</span>}
                {p.label}
              </button>
            ))}
          </div>
          {section !== 'start' && SUBS[section].length > 1 && (
            <div className="nav-secondary">
              {SUBS[section].map((t) => (
                <button key={t.key} className={activeSub === t.key ? 'active' : ''} onClick={() => { setSub({ ...sub, [section]: t.key }); window.scrollTo({ top: 0 }) }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <Guides on={guidesOn}>
        <PageTour.Provider value={page ? () => startTour(page) : null}>
          <main className="container">
            {content}
            {!io && (
              <div className="footer">
                CPAP Demand Estimation &amp; Forecasting. Prepared by WJCF. All calculations run in your web browser.<br />
                For support, contact the developer at <a href="mailto:mchaurasiya@wjcf.in">mchaurasiya@wjcf.in</a>
              </div>
            )}
          </main>
        </PageTour.Provider>
      </Guides>
      {io && (
        <div className="io-footer">
          Prepared by WJCF. All calculations run in your web browser. Support: <a href="mailto:mchaurasiya@wjcf.in">mchaurasiya@wjcf.in</a>
        </div>
      )}

      {io && (
        <div className="sec-trial" role="group" aria-label="Section design trial">
          <span className="sec-trial-label">Section design (trial)</span>
          <div className="io-seg small">
            {SEC_DESIGNS.map((d) => (
              <button key={d.key || 'current'} type="button" aria-pressed={sec === d.key} className={sec === d.key ? 'on' : ''} onClick={() => setSec(d.key)}>{d.label}</button>
            ))}
          </div>
        </div>
      )}

      {track && tour && <TourOverlay track={track} index={tour.index} onPrev={prevStep} onNext={nextStep} onClose={endTour} />}
    </div>
  )
}
