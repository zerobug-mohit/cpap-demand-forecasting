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
  { key: 'rds', label: 'RDS prevalence' },
  { key: 'facility', label: 'Deliveries × FBNC norms' },
]

export default function EstimationTopDown({ m2, setM2, m3, setM3 }: Props) {
  const [approach, setApproach] = useState<Approach>('rds')

  return (
    <div>
      <div className="card lens-explainer" style={{ marginBottom: 16 }}>
        <h2>Epidemiological need — two approaches</h2>
        <p className="card-note" style={{ marginTop: 4 }}>
          This tab estimates how many CPAP machines newborns actually need, based on health data rather than on the
          facilities that exist today. There are two ways to do this. The first uses <strong>how common newborn
          breathing problems (RDS) are</strong>. The second counts the <strong>babies delivered in public health
          facilities</strong> and applies the government (FBNC) norm for how many machines a facility should have.
          Choose an approach below.
        </p>
        <div className="epi-switch" role="tablist" aria-label="Epidemiological need approach">
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
