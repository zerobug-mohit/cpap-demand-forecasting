import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Track } from '../data/guide'

// The guided tour: dims the page, outlines the part being explained, and shows a card with the
// explanation and Back / Next. The page underneath still works, so people can try what the card
// describes. A step without a target shows its card in the middle of the screen.

interface Box { top: number; left: number; width: number; height: number }
const PAD = 6
const GAP = 14
const EDGE = 12

const anchorOf = (el: HTMLElement) => (el.classList.contains('sticky-col') && el.parentElement ? el.parentElement : el)

interface Props {
  track: Track
  index: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}

export default function TourOverlay({ track, index, onPrev, onNext, onClose }: Props) {
  const step = track.steps[index]
  const [box, setBox] = useState<Box | null>(null)
  const [bubbleH, setBubbleH] = useState(220)
  const bubble = useRef<HTMLDivElement>(null)
  const isFirst = index === 0
  const isLast = index === track.steps.length - 1

  // Find the target (the app may still be switching pages), scroll it into view and measure it.
  useLayoutEffect(() => {
    setBox(null)
    if (!step.target) return
    let raf = 0
    let tries = 0
    let el: HTMLElement | null = null
    const measure = () => {
      if (!el) return
      const r = el.getBoundingClientRect()
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    const locate = () => {
      el = document.querySelector<HTMLElement>(step.target as string)
      if (el && el.getBoundingClientRect().height > 0) {
        const vh = window.innerHeight
        const h = el.getBoundingClientRect().height
        if (el.closest('.io-col')) {
          // inside a column that scrolls on its own: let the browser scroll that column
          el.scrollIntoView({ behavior: 'smooth', block: h > vh * 0.5 ? 'start' : 'center' })
        } else {
          const top = anchorOf(el).getBoundingClientRect().top + window.scrollY
          const to = h > vh * 0.6 ? top - 80 : top - (vh - h) / 2
          window.scrollTo({ top: Math.max(0, to), behavior: 'smooth' })
        }
        raf = requestAnimationFrame(measure)
      } else if (tries++ < 90) {
        raf = requestAnimationFrame(locate)
      }
    }
    locate()
    const again = () => measure()
    window.addEventListener('resize', again)
    window.addEventListener('scroll', again, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', again)
      window.removeEventListener('scroll', again, true)
    }
  }, [step.target, index, track.key])

  useLayoutEffect(() => {
    if (bubble.current) setBubbleH(bubble.current.offsetHeight)
  }, [index, track.key, box !== null])

  useEffect(() => {
    bubble.current?.focus({ preventScroll: true })
  }, [index, track.key])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onNext()
      else if (e.key === 'ArrowLeft' && !isFirst) onPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNext, onPrev, isFirst])

  // Place the card below the part, else above it, else beside it, else in the bottom corner.
  const vw = window.innerWidth
  const vh = window.innerHeight
  const BW = Math.min(380, vw - EDGE * 2)
  let style: CSSProperties
  if (box) {
    const clampX = (x: number) => Math.max(EDGE, Math.min(x, vw - BW - EDGE))
    const clampY = (y: number) => Math.max(EDGE, Math.min(y, vh - bubbleH - EDGE))
    const bottom = box.top + box.height
    const right = box.left + box.width
    if (bottom + GAP + bubbleH <= vh - EDGE) style = { top: bottom + GAP, left: clampX(box.left + box.width / 2 - BW / 2) }
    else if (box.top - GAP - bubbleH >= EDGE) style = { top: box.top - GAP - bubbleH, left: clampX(box.left + box.width / 2 - BW / 2) }
    else if (right + GAP + BW <= vw - EDGE) style = { top: clampY(box.top), left: right + GAP }
    else if (box.left - GAP - BW >= EDGE) style = { top: clampY(box.top), left: box.left - GAP - BW }
    else style = { top: vh - bubbleH - EDGE * 2, left: vw - BW - EDGE * 2 }
    style.width = BW
  } else {
    style = { top: '50%', left: '50%', width: BW, transform: 'translate(-50%, -50%)' }
  }

  const titleId = `tour-title-${track.key}-${index}`
  return (
    <div className="tour-root">
      {box ? (
        <div className="tour-spot" style={{ top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div ref={bubble} className="tour-card" style={style} role="dialog" aria-labelledby={titleId} tabIndex={-1}>
        <div className="tour-card-head">
          <span className="tour-card-track">{track.label}</span>
          <span className="tour-card-count">
            {index + 1} / {track.steps.length}
          </span>
        </div>
        <div className="tour-card-bar" aria-hidden>
          {track.steps.map((_, i) => (
            <span key={i} className={i < index ? 'done' : i === index ? 'now' : ''} />
          ))}
        </div>
        <h2 className="tour-card-title" id={titleId}>{step.title}</h2>
        <p className="tour-card-body">{step.body}</p>
        <div className="tour-card-actions">
          <button type="button" className="tour-btn quiet" onClick={onClose}>Exit tour</button>
          <span className="tour-card-nav">
            {!isFirst && <button type="button" className="tour-btn" onClick={onPrev}>Back</button>}
            <button type="button" className="tour-btn primary" onClick={onNext}>{isLast ? 'Finish' : 'Next'}</button>
          </span>
        </div>
      </div>
    </div>
  )
}
