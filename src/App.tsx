import { useState } from 'react'
import Header from './components/Header'
import EstimationBottomUp from './components/EstimationBottomUp'
import EstimationTopDown from './components/EstimationTopDown'
import PrivateSector from './components/PrivateSector'
import Comparison from './components/Comparison'
import Forecast from './components/Forecast'
import ForecastWIP from './components/ForecastWIP'

// Forecasting tab is masked with a WIP placeholder until the methodology is finalised.
// Flip to false to re-enable the interactive Forecast module.
const FORECAST_WIP = true
import { DEFAULT_NORMS } from './engine/method1'
import type { Norms } from './engine/method1'
import { DEFAULT_M2, DEFAULT_M2_PRIVATE } from './engine/method2'
import type { M2Norms } from './engine/method2'
import { DEFAULT_M3 } from './engine/method3'
import type { M3Norms } from './engine/method3'
import { DEFAULT_PRIVATE } from './engine/methodPrivate'
import type { PrivateNorms } from './engine/methodPrivate'

type Section = 'estimation' | 'forecasting'

interface Tab {
  key: string
  label: string
}

const SUBS: Record<Section, Tab[]> = {
  estimation: [
    { key: 'bu', label: 'Guidelines-based current demand' },
    { key: 'td', label: 'Epidemiological Need' },
    { key: 'pvt', label: 'Private sector Demand' },
    { key: 'cmp', label: 'Compare estimates' },
  ],
  forecasting: [{ key: 'fc', label: 'Forecast' }],
}

const PRIMARY: { key: Section; label: string }[] = [
  { key: 'estimation', label: 'CPAP Demand Estimation' },
  { key: 'forecasting', label: 'CPAP Demand Forecasting' },
]

interface ContentProps {
  section: Section
  sub: string
  m1: Norms
  setM1: (n: Norms) => void
  m2: M2Norms
  setM2: (n: M2Norms) => void
  m3: M3Norms
  setM3: (n: M3Norms) => void
  mp: PrivateNorms
  setMp: (n: PrivateNorms) => void
  mprv: M2Norms
  setMprv: (n: M2Norms) => void
}

function renderContent({ section, sub, m1, setM1, m2, setM2, m3, setM3, mp, setMp, mprv, setMprv }: ContentProps) {
  if (section === 'estimation') {
    if (sub === 'bu') return <EstimationBottomUp norms={m1} onChange={setM1} />
    if (sub === 'td') return <EstimationTopDown m2={m2} setM2={setM2} m3={m3} setM3={setM3} />
    if (sub === 'pvt') return <PrivateSector mp={mp} setMp={setMp} mprv={mprv} setMprv={setMprv} />
    return <Comparison m1={m1} m2={m2} m3={m3} />
  }
  return FORECAST_WIP ? <ForecastWIP /> : <Forecast m1={m1} m2={m2} />
}

export default function App() {
  const [section, setSection] = useState<Section>('estimation')
  const [sub, setSub] = useState<Record<Section, string>>({ estimation: 'bu', forecasting: 'fc' })
  const [m1, setM1] = useState<Norms>(DEFAULT_NORMS)
  const [m2, setM2] = useState<M2Norms>(DEFAULT_M2)
  const [m3, setM3] = useState<M3Norms>(DEFAULT_M3)
  const [mp, setMp] = useState<PrivateNorms>(DEFAULT_PRIVATE)
  const [mprv, setMprv] = useState<M2Norms>(DEFAULT_M2_PRIVATE)
  const activeSub = sub[section]

  return (
    <>
      <Header />

      <nav className="app-nav">
        <div className="app-nav-inner">
          <div className="nav-primary">
            {PRIMARY.map((p, i) => (
              <button key={p.key} className={section === p.key ? 'active' : ''} onClick={() => setSection(p.key)}>
                <span className="nav-num">{String(i + 1).padStart(2, '0')}</span>
                {p.label}
              </button>
            ))}
          </div>
          {SUBS[section].length > 1 && (
            <div className="nav-secondary">
              {SUBS[section].map((t) => (
                <button
                  key={t.key}
                  className={activeSub === t.key ? 'active' : ''}
                  onClick={() => setSub({ ...sub, [section]: t.key })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="container">
        {renderContent({ section, sub: activeSub, m1, setM1, m2, setM2, m3, setM3, mp, setMp, mprv, setMprv })}

        <div className="footer">
          CPAP Demand Estimator · all calculation runs client-side.<br />
          For support, reach out to the developer at{' '}
          <a href="mailto:mchaurasiya@wjcf.in">mchaurasiya@wjcf.in</a>
        </div>
      </main>
    </>
  )
}
