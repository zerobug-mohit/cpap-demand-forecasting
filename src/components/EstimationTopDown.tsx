import { useState } from 'react'
import type { M2Norms } from '../engine/method2'
import type { M3Norms } from '../engine/method3'
import { DEFAULT_M3 } from '../engine/method3'
import EpiFacility from './EpiFacility'
import EpiRds from './EpiRds'

type Approach = 'facility' | 'rds'

interface Props {
  m2: M2Norms
  setM2: (n: M2Norms) => void
  m3: M3Norms
  setM3: (n: M3Norms) => void
}

const APPROACHES: { key: Approach; label: string }[] = [
  { key: 'facility', label: 'Deliveries × FBNC norms' },
  { key: 'rds', label: 'RDS prevalence' },
]

export default function EstimationTopDown({ m2, setM2, m3, setM3 }: Props) {
  const [approach, setApproach] = useState<Approach>('facility')

  return (
    <div>
      <div className="card lens-explainer" style={{ marginBottom: 16 }}>
        <h2>Ideal demand · two approaches</h2>
        <p className="card-note" style={{ marginTop: 4 }}>
          Two ways to estimate the ideal CPAP demand — one based on <strong>deliveries in public facilities and FBNC
          norms</strong>, the other based on <strong>RDS prevalence</strong>:
        </p>
        <div className="epi-switch" role="tablist" aria-label="Ideal demand approach">
          {APPROACHES.map((a) => (
            <button key={a.key} role="tab" aria-selected={approach === a.key}
              className={approach === a.key ? 'active' : ''} onClick={() => setApproach(a.key)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {approach === 'facility'
        ? <EpiFacility norms={m3} onChange={setM3} onReset={() => setM3(DEFAULT_M3)} />
        : <EpiRds norms={m2} onChange={setM2} />}
    </div>
  )
}
