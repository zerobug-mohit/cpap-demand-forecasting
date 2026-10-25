import { useEffect, useState } from 'react'
import type { PageStep } from '../data/guide'
import { CheckIcon, TourIcon } from './Icon'

// The steps of the current page, in order, kept at the top of the screen. The step being read is
// highlighted and the steps above it are ticked. Clicking a step scrolls to it.

const LINE = 150 // px from the top of the screen: a step counts as reached once its top passes this line
const OFFSET = 64 // px left above a step when jumping to it, so the strip does not cover its heading

const find = (id: string) => document.querySelector<HTMLElement>(`[data-step="${id}"]`)

// A sticky panel (the inputs on the left) never scrolls past the line, so measure its column instead.
const anchorOf = (el: HTMLElement) => (el.classList.contains('sticky-col') && el.parentElement ? el.parentElement : el)

export default function StepTrack({ steps, onTour }: { steps: PageStep[]; onTour: () => void }) {
  const [shown, setShown] = useState<PageStep[]>(steps)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const here = steps.filter((s) => find(s.id))
      setShown((prev) => (prev.length === here.length && prev.every((s, i) => s.id === here[i].id) ? prev : here))
      let cur = 0
      here.forEach((s, i) => {
        if (anchorOf(find(s.id)!).getBoundingClientRect().top <= LINE) cur = i
      })
      // At the very bottom of the page the last step is the one being read, even if it is short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = here.length - 1
      setCurrent(Math.max(0, cur))
    }
    const later = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    // Charts and the forecast simulation can render a moment after the page, so measure again.
    const t1 = window.setTimeout(measure, 300)
    const t2 = window.setTimeout(measure, 1200)
    window.addEventListener('scroll', later, { passive: true })
    window.addEventListener('resize', later)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('scroll', later)
      window.removeEventListener('resize', later)
    }
  }, [steps])

  const go = (i: number) => {
    const el = find(shown[i].id)
    if (!el) return
    const top = i === 0 ? 0 : anchorOf(el).getBoundingClientRect().top + window.scrollY - OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
    el.classList.remove('step-flash')
    void el.offsetWidth // restart the highlight if the same step is clicked twice
    el.classList.add('step-flash')
    window.setTimeout(() => el.classList.remove('step-flash'), 1600)
  }

  return (
    <nav className="step-track" aria-label="Steps on this page" data-tour="step-track">
      <div className="step-track-inner">
        <span className="step-track-count" aria-live="polite">
          Step {current + 1} of {shown.length}
        </span>
        <ol className="step-track-list">
          {shown.map((s, i) => {
            const state = i < current ? 'done' : i === current ? 'now' : 'next'
            return (
              <li key={s.id}>
                <button type="button" className={`step-track-step ${state}`} aria-current={i === current ? 'step' : undefined} onClick={() => go(i)}>
                  <span className="step-track-n" aria-hidden>{state === 'done' ? <CheckIcon /> : i + 1}</span>
                  <span className="step-track-label">{s.label}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <button type="button" className="step-track-tour" onClick={onTour}>
          <TourIcon />
          Tour this page
        </button>
      </div>
    </nav>
  )
}
