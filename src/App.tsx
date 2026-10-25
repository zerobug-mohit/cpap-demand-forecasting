import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import Cover from './components/Cover'
import StepTrack from './components/StepTrack'
import TourOverlay from './components/TourOverlay'
import { Guides } from './components/Explain'
import EstimationBottomUp from './components/EstimationBottomUp'
import EstimationTopDown from './components/EstimationTopDown'
import PrivateSector from './components/PrivateSector'
import Comparison from './components/Comparison'
import Forecast from './components/Forecast'

import { DEFAULT_NORMS } from './engine/method1'
import type { Norms } from './engine/method1'
import { DEFAULT_M2, DEFAULT_M2_PRIVATE } from './engine/method2'
import type { M2Norms } from './engine/method2'
import { DEFAULT_M3 } from './engine/method3'
import type { M3Norms } from './engine/method3'
import { DEFAULT_PRIVATE } from './engine/methodPrivate'
import type { PrivateNorms } from './engine/methodPrivate'
import { PAGE_STEPS, pageOf, trackOf } from './data/guide'
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

  // A tour step can move the app to another page before it points at something there.
  const track = tour ? trackOf(tour.key) : null
  useEffect(() => {
    if (!tour) return
    const t = trackOf(tour.key)
    goTo(t.steps[tour.index].place ?? t.place)
  }, [tour, goTo])

  const startTour = (key: TrackKey) => setTour({ key, index: 0 })
  const endTour = useCallback(() => setTour(null), [])
  const nextStep = useCallback(
    () => setTour((t) => (t && t.index < trackOf(t.key).steps.length - 1 ? { ...t, index: t.index + 1 } : null)),
    [],
  )
  const prevStep = useCallback(() => setTour((t) => (t && t.index > 0 ? { ...t, index: t.index - 1 } : t)), [])

  const content = (() => {
    if (section === 'start') return <Cover m1={m1} m2={m2} m3={m3} mp={mp} mprv={mprv} onOpen={open} onTour={startTour} />
    if (section === 'estimation') {
      if (activeSub === 'bu') return <EstimationBottomUp norms={m1} onChange={setM1} />
      if (activeSub === 'td') return <EstimationTopDown approach={td} onApproach={setTd} m2={m2} setM2={setM2} m3={m3} setM3={setM3} />
      return <Comparison m1={m1} m2={m2} m3={m3} />
    }
    if (section === 'private') return <PrivateSector approach={pvt} onApproach={setPvt} mp={mp} setMp={setMp} mprv={mprv} setMprv={setMprv} />
    return <Forecast m1={m1} m3={m3} />
  })()

  return (
    <>
      <Header guidesOn={guidesOn} onGuides={setGuides} onTour={startTour} />

      <nav className="app-nav" aria-label="Main tabs">
        <div className="app-nav-inner">
          <div className="nav-primary" data-tour="nav-primary">
            {PRIMARY.map((p) => (
              <button key={p.key} className={section === p.key ? 'active' : ''} aria-current={section === p.key ? 'page' : undefined} onClick={() => { setSection(p.key); window.scrollTo({ top: 0 }) }}>
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

      {page && <StepTrack key={page} steps={PAGE_STEPS[page]} onTour={() => startTour(page)} />}

      <Guides on={guidesOn}>
        <main className={`container${page ? ' has-steps' : ''}`}>
          {content}

          <div className="footer">
            CPAP Demand Estimation &amp; Forecasting. Prepared by WJCF. All calculations run in your web browser.<br />
            For support, contact the developer at <a href="mailto:mchaurasiya@wjcf.in">mchaurasiya@wjcf.in</a>
          </div>
        </main>
      </Guides>

      {track && tour && <TourOverlay track={track} index={tour.index} onPrev={prevStep} onNext={nextStep} onClose={endTour} />}
    </>
  )
}
