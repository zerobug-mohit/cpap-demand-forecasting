import { createContext, useContext, useId, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { EXPLAIN } from '../data/explainers'
import type { Explainer } from '../data/explainers'
import { BulbIcon } from './Icon'

// Bulbs are on by default. Wrap part of the page in <NoBulbs> to turn them off there: headings and
// section heads show without a bulb, and the labels ExplainHere draws stay as plain labels.
const BulbsOn = createContext(true)

export function NoBulbs({ children }: { children: ReactNode }) {
  return <BulbsOn.Provider value={false}>{children}</BulbsOn.Provider>
}

/** True when the masthead's Guides switch is on. */
export const useGuidesOn = () => useContext(BulbsOn)

/** The "Show guides" switch in the masthead turns every bulb in the tool on or off. */
export function Guides({ on, children }: { on: boolean; children: ReactNode }) {
  return <BulbsOn.Provider value={on}>{children}</BulbsOn.Provider>
}

// The light-bulb toggle. Pressed, it shows a short plain-language explanation of the part beside it.
function Bulb({ open, onClick, controls, title }: { open: boolean; onClick: () => void; controls: string; title: string }) {
  // Checked here too, because a parent can build the bulb with useExplain above the <NoBulbs> it renders.
  if (!useContext(BulbsOn)) return null
  return (
    <button type="button" className="explain-btn" aria-expanded={open} aria-controls={controls}
      aria-label={`${open ? 'Hide' : 'Show'} explanation: ${title}`} title={open ? 'Hide explanation' : 'What is this?'} onClick={onClick}>
      <BulbIcon />
    </button>
  )
}

function Panel({ id, e }: { id: string; e: Explainer }) {
  return (
    <div className="explain-panel" id={id} role="region" aria-label={`Explanation: ${e.title}`}>
      <dl>
        <dt>What it shows</dt>
        <dd>{e.what}</dd>
        <dt>How it works</dt>
        <dd>{e.how}</dd>
        {e.read && (
          <>
            <dt>How to read it</dt>
            <dd>{e.read}</dd>
          </>
        )}
      </dl>
    </div>
  )
}

/** A part's heading with a light-bulb button beside it; the explanation opens under the heading. */
export function ExplainTitle({ id, children, as: Tag = 'h2', className, style }: { id: string; children: ReactNode; as?: 'h2' | 'h3'; className?: string; style?: CSSProperties }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const on = useContext(BulbsOn)
  const e = EXPLAIN[id]
  if (!e || !on) return <Tag className={className} style={style}>{children}</Tag>
  return (
    <>
      <div className="explain-head">
        <Tag className={className} style={style}>{children}</Tag>
        <Bulb open={open} onClick={() => setOpen(!open)} controls={panelId} title={e.title} />
      </div>
      {open && <Panel id={panelId} e={e} />}
    </>
  )
}

/**
 * For custom layouts, e.g. a heading that is itself a button (a bulb cannot sit inside a button):
 * returns the bulb and the panel separately so the caller places them. Both are null when the id
 * has no explainer.
 */
export function useExplain(id: string | undefined) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const on = useContext(BulbsOn)
  const e = id ? EXPLAIN[id] : undefined
  if (!e || !on) return { bulb: null, panel: null }
  return {
    bulb: <Bulb open={open} onClick={() => setOpen(!open)} controls={panelId} title={e.title} />,
    panel: open ? <Panel id={panelId} e={e} /> : null,
  }
}

/** For a part with no heading of its own (a row of figures, a map, a control group): a small labelled bulb. */
export function ExplainHere({ id, label }: { id: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const e = EXPLAIN[id]
  const on = useContext(BulbsOn)
  if (!e) return null
  if (!on) return <div className="explain-here"><span className="explain-here-label">{label ?? e.title}</span></div>
  return (
    <div className="explain-here">
      <div className="explain-head">
        <span className="explain-here-label">{label ?? e.title}</span>
        <Bulb open={open} onClick={() => setOpen(!open)} controls={panelId} title={e.title} />
      </div>
      {open && <Panel id={panelId} e={e} />}
    </div>
  )
}
