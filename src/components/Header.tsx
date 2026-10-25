import { useEffect, useRef, useState } from 'react'
import { TRACK_GROUPS, trackOf } from '../data/guide'
import type { TrackKey } from '../data/guide'
import { BulbIcon, TourIcon } from './Icon'

interface Props {
  guidesOn: boolean
  onGuides: (on: boolean) => void
  onTour: (k: TrackKey) => void
}

export default function Header({ guidesOn, onGuides, onTour }: Props) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <h1>CPAP Demand Estimation &amp; Forecasting</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            role="switch"
            aria-checked={guidesOn}
            className={`guides-switch${guidesOn ? ' on' : ''}`}
            onClick={() => onGuides(!guidesOn)}
            data-tour="guides-switch"
            title={guidesOn ? 'Hide the bulbs beside each part of the page' : 'Show the bulbs beside each part of the page'}
          >
            <BulbIcon />
            <span>Guides</span>
            <span className="switch-track" aria-hidden>
              <span className="switch-knob" />
            </span>
            <span className="switch-state" aria-hidden>{guidesOn ? 'On' : 'Off'}</span>
          </button>
          <div className="tour-menu-wrap" ref={wrap}>
            <button
              type="button"
              className="tour-menu-btn"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen(!open)}
              data-tour="tour-button"
            >
              <TourIcon />
              Guided tour
            </button>
            {open && (
              <div className="tour-menu" role="menu" aria-label="Choose a guided tour">
                <p className="tour-menu-note">
                  Choose a walkthrough. It points at each part of a page in turn and explains it. You can exit at any time.
                </p>
                {TRACK_GROUPS.map((g) => (
                  <div key={g.label} className="tour-menu-group" role="group" aria-label={g.label}>
                    <div className="tour-menu-group-label" aria-hidden>{g.label}</div>
                    {g.keys.map((k) => {
                      const t = trackOf(k)
                      return (
                        <button
                          key={k}
                          type="button"
                          role="menuitem"
                          className="tour-menu-item"
                          onClick={() => {
                            setOpen(false)
                            onTour(k)
                          }}
                        >
                          <span className="tour-menu-item-title">{t.label}</span>
                          <span className="tour-menu-item-len">{t.steps.length} steps</span>
                          <span className="tour-menu-item-desc">{t.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
