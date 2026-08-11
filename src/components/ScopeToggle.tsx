import type { Scope } from '../engine/method1'

interface Props {
  scope: Scope
  onChange: (s: Scope) => void
}

const OPTS: { value: Scope; label: string }[] = [
  { value: 'sncu', label: 'SNCU' },
  { value: 'sncu_nbsu', label: '+ NBSU' },
  { value: 'sncu_nbsu_transport', label: '+ Transport' },
]

export default function ScopeToggle({ scope, onChange }: Props) {
  return (
    <div className="scope-toggle" role="group" aria-label="CPAP scope">
      {OPTS.map((o) => (
        <button
          key={o.value}
          className={scope === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
          aria-pressed={scope === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
