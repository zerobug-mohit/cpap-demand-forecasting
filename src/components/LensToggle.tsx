import type { Lens } from '../engine/method1'

interface Props {
  lens: Lens
  onChange: (l: Lens) => void
}

export default function LensToggle({ lens, onChange }: Props) {
  return (
    <div className="toggle-group" role="tablist" aria-label="Estimation lens">
      <button
        role="tab"
        aria-selected={lens === 'asis'}
        className={lens === 'asis' ? 'active' : ''}
        onClick={() => onChange('asis')}
      >
        Current infra-based
      </button>
      <button
        role="tab"
        aria-selected={lens === 'normative'}
        className={lens === 'normative' ? 'active' : ''}
        onClick={() => onChange('normative')}
      >
        Normative (build-out)
      </button>
    </div>
  )
}
