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
  { key: 'facility', label: 'Facility-based need' },
  { key: 'rds', label: 'RDS-based redistribution' },
]

export default function EstimationTopDown({ m2, setM2, m3, setM3 }: Props) {
  const [approach, setApproach] = useState<Approach>('facility')

  return (
    <div>
      <div className="card lens-explainer" style={{ marginBottom: 16 }}>
        <h2>Epidemiological estimation · two independent approaches</h2>
        <p className="card-note" style={{ marginTop: 4 }}>
          Both size CPAP from clinical/service need rather than the current SNCU asset base — but from different evidence.
          Switch between them:
        </p>
        <div className="epi-switch" role="tablist" aria-label="Epidemiological approach">
          {APPROACHES.map((a) => (
            <button key={a.key} role="tab" aria-selected={approach === a.key}
              className={approach === a.key ? 'active' : ''} onClick={() => setApproach(a.key)}>
              {a.label}
            </button>
          ))}
        </div>
        <p className="card-note" style={{ marginTop: 10, marginBottom: 0 }}>
          {approach === 'facility' ? (
            <>
              <strong>Facility-based need (Cascade B):</strong> counts the deliveries the public network conducts
              (District Hospitals, Medical Colleges, Sub-District Hospitals, CHCs) and applies an editable FBNC norm
              (beds/1,000 deliveries × CPAP/bed). A bottom-up, facility-anchored need model. The private sector is
              estimated on its own tab.
            </>
          ) : (
            <>
              <strong>RDS-based redistribution:</strong> anchors a national CPAP-eligible pool to the literature RDS rate
              × correction factor, then splits it across states by an LBW + NMR risk index. A population-epidemiology
              model, independent of any facility count.
            </>
          )}
        </p>
      </div>

      {approach === 'facility'
        ? <EpiFacility norms={m3} onChange={setM3} onReset={() => setM3(DEFAULT_M3)} />
        : <EpiRds norms={m2} onChange={setM2} />}
    </div>
  )
}
