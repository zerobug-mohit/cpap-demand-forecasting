import { useState } from 'react'
import Header from './components/Header'
import EstimationBottomUp from './components/EstimationBottomUp'
import EstimationTopDown from './components/EstimationTopDown'
import Comparison from './components/Comparison'
import Forecast from './components/Forecast'
import { DEFAULT_NORMS } from './engine/method1'
import type { Norms } from './engine/method1'
import { DEFAULT_M2 } from './engine/method2'
import type { M2Norms } from './engine/method2'

type Section = 'estimation' | 'forecasting'

interface Tab {
  key: string
  label: string
}

const SUBS: Record<Section, Tab[]> = {
  estimation: [
    { key: 'bu', label: 'Guidelines-based' },
    { key: 'td', label: 'Epidemiological' },
    { key: 'cmp', label: 'Guidelines-based vs Epidemiological' },
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
}

function renderContent({ section, sub, m1, setM1, m2, setM2 }: ContentProps) {
  if (section === 'estimation') {
    if (sub === 'bu') return <EstimationBottomUp norms={m1} onChange={setM1} />
    if (sub === 'td') return <EstimationTopDown norms={m2} onChange={setM2} />
    return <Comparison m1={m1} m2={m2} />
  }
  return <Forecast m1={m1} m2={m2} />
}

export default function App() {
  const [section, setSection] = useState<Section>('estimation')
  const [sub, setSub] = useState<Record<Section, string>>({ estimation: 'bu', forecasting: 'fc' })
  const [m1, setM1] = useState<Norms>(DEFAULT_NORMS)
  const [m2, setM2] = useState<M2Norms>(DEFAULT_M2)
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
        {renderContent({ section, sub: activeSub, m1, setM1, m2, setM2 })}

        <div className="footer">
          CPAP Demand Estimator · all calculation runs client-side.<br />
          For support, reach out to the developer at{' '}
          <a href="mailto:mchaurasiya@wjcf.in">mchaurasiya@wjcf.in</a>
        </div>
      </main>
    </>
  )
}
