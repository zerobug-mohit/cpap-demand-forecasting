import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  badge?: ReactNode
  defaultOpen?: boolean
  /** factor ids contained in this section; a matching factor-pill click opens it. */
  ids?: string[]
  children: ReactNode
}

export default function PanelSection({ title, badge, defaultOpen = false, ids, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const idKey = ids ? ids.join(',') : ''
  useEffect(() => {
    if (!idKey) return
    const set = new Set(idKey.split(','))
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail as string
      if (set.has(id)) setOpen(true)
    }
    window.addEventListener('factorfocus', handler)
    return () => window.removeEventListener('factorfocus', handler)
  }, [idKey])

  return (
    <div className="panel-section">
      <button className="panel-section-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={`chevron ${open ? 'open' : ''}`}>▸</span>
        <span className="panel-section-title">{title}</span>
        {badge && <span className="panel-section-badge">{badge}</span>}
      </button>
      {open && <div className="panel-section-body">{children}</div>}
    </div>
  )
}
