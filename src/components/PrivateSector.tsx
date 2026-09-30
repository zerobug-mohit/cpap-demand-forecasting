import { useState } from 'react'
import type { PrivateNorms } from '../engine/methodPrivate'
import { DEFAULT_PRIVATE } from '../engine/methodPrivate'
import type { M2Norms } from '../engine/method2'
import PrivateHomes from './PrivateHomes'
import EpiRds from './EpiRds'

type Approach = 'homes' | 'rds'

interface Props {
  mp: PrivateNorms
  setMp: (n: PrivateNorms) => void
  mprv: M2Norms
  setMprv: (n: M2Norms) => void
}

const APPROACHES: { key: Approach; label: string }[] = [
  { key: 'homes', label: 'Maternity homes' },
  { key: 'rds', label: 'RDS prevalence (private)' },
]

export default function PrivateSector({ mp, setMp, mprv, setMprv }: Props) {
  const [approach, setApproach] = useState<Approach>('homes')

  return (
    <div>
      <div className="card lens-explainer" style={{ marginBottom: 16 }}>
        <h2>Private sector demand · two approaches</h2>
        <p className="card-note" style={{ marginTop: 4 }}>
          The private maternity sector is estimated on its own, <strong>separate</strong> from the public (government)
          system. There are two ways to size it. The first counts <strong>private maternity homes</strong> and how many
          CPAP machines each should have. The second uses <strong>how common newborn breathing problems are</strong>,
          applied to babies born in private facilities (about 35% of all facility births). Choose an approach below.
        </p>
        <div className="epi-switch" role="tablist" aria-label="Private sector approach">
          {APPROACHES.map((a) => (
            <button key={a.key} role="tab" aria-selected={approach === a.key}
              className={approach === a.key ? 'active' : ''} onClick={() => setApproach(a.key)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {approach === 'homes'
        ? <PrivateHomes norms={mp} onChange={setMp} onReset={() => setMp(DEFAULT_PRIVATE)} />
        : <EpiRds norms={mprv} onChange={setMprv} />}
    </div>
  )
}
