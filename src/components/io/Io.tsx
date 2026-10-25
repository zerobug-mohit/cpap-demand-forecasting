import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, ResetIcon, TourIcon } from '../Icon'
import { useGuidesOn } from '../Explain'

// The two-panel kit, after OxyCost: an Inputs column (numbered steps that open one at a time, with a
// progress tracker and Back / Next) beside an Output column (results that update as you type, and a
// calculation breakdown). In a calculation, every value the user can set is a yellow pill; clicking
// it opens the step that holds that input on the left, scrolls to it, highlights it and focuses it.

// ---------------- jumping from a pill to its input ----------------

const OPEN_STEP = 'io-open-step'

/** Open the step that holds `field` in the Inputs column of `scope`, then scroll to the field and focus it. */
export function goToField(scope: string, field: string) {
  const find = () => document.querySelector<HTMLElement>(`[data-field-scope="${scope}"] [data-field="${field}"]`)
  const el = find()
  if (!el) return
  const card = el.closest<HTMLElement>('[data-io-step]')
  if (card) window.dispatchEvent(new CustomEvent(OPEN_STEP, { detail: { scope, n: Number(card.dataset.ioStep) } }))
  let tries = 0
  const show = () => {
    const target = find()
    if (target && target.offsetParent !== null) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.classList.remove('field-flash')
      void target.offsetWidth
      target.classList.add('field-flash')
      target.querySelector<HTMLElement>('input, select, button')?.focus({ preventScroll: true })
      window.setTimeout(() => target.classList.remove('field-flash'), 1800)
    } else if (tries++ < 20) {
      requestAnimationFrame(show)
    }
  }
  requestAnimationFrame(show)
}

/** Open a step from outside the page, for example from a guided tour. */
export function openIoStep(scope: string, n: number) {
  window.dispatchEvent(new CustomEvent(OPEN_STEP, { detail: { scope, n } }))
}

/** Which step is open, which have been opened, and how to move between them. */
export function useSteps(scope: string, total: number) {
  const [open, setOpen] = useState<number | null>(1)
  const [seen, setSeen] = useState<Set<number>>(() => new Set([1]))
  const go = (n: number) => {
    setOpen(n)
    setSeen((s) => new Set(s).add(n))
    requestAnimationFrame(() =>
      document.querySelector(`[data-field-scope="${scope}"] [data-io-step="${n}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }
  const toggle = (n: number) => {
    if (open === n) setOpen(null)
    else go(n)
  }
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { scope: string; n: number }
      if (d.scope === scope && d.n <= total) {
        setOpen(d.n)
        setSeen((s) => new Set(s).add(d.n))
      }
    }
    window.addEventListener(OPEN_STEP, on)
    return () => window.removeEventListener(OPEN_STEP, on)
  }, [scope, total])
  return { open, seen, go, toggle, total }
}
export type Steps = ReturnType<typeof useSteps>

// ---------------- page and columns ----------------

const ScopeCtx = createContext('')
export const useScope = () => useContext(ScopeCtx)

/** Starts the guided tour of the page on show; given by the app. */
export const PageTour = createContext<(() => void) | null>(null)

export function IoPage({ scope, inputs, output }: { scope: string; inputs: ReactNode; output: ReactNode }) {
  return (
    <ScopeCtx.Provider value={scope}>
      <div className="io-grid">
        <section className="io-col io-in" data-field-scope={scope} data-tour="io-inputs" aria-label="Inputs">
          <ColumnHeader title="Inputs" sub="change any value" action={<TourButton />} />
          {inputs}
        </section>
        <section className="io-col io-out" data-tour="io-output" aria-label="Output">
          <ColumnHeader title="Output" sub="your results, updated as you type" />
          {output}
        </section>
      </div>
    </ScopeCtx.Provider>
  )
}

function ColumnHeader({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="io-colhead">
      <span className="io-colname">
        <span className="io-coltitle">{title}</span>
        <span className="io-colsub">{sub}</span>
      </span>
      {action}
    </div>
  )
}

function TourButton() {
  const start = useContext(PageTour)
  if (!start) return null
  return (
    <button type="button" className="io-tour" onClick={start}>
      <TourIcon /> Tour this page
    </button>
  )
}

/** The choice between two approaches on one tab, kept at the top of the Inputs column. */
export function ApproachSwitch<K extends string>({ label, options, value, onChange, note }: {
  label: string; options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; note: ReactNode
}) {
  return (
    <div className="io-approach" data-tour="io-approach">
      <div className="io-approach-row">
        <span className="io-approach-label">{label}</span>
        <div className="io-seg" role="tablist" aria-label={label}>
          {options.map((o) => (
            <button key={o.key} type="button" role="tab" aria-selected={value === o.key} className={value === o.key ? 'on' : ''} onClick={() => onChange(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <p className="io-approach-note">{note}</p>
    </div>
  )
}

// ---------------- steps ----------------

export function StepProgress({ steps, labels }: { steps: Steps; labels: string[] }) {
  const cur = steps.open
  return (
    <div className="io-progress" data-tour="io-progress">
      <div className="io-progress-cap">
        {cur ? `Step ${cur} of ${steps.total}` : `${steps.total} steps`} · every value starts at a preset, so you can read the results at once
      </div>
      <ol className="io-progress-track">
        {labels.slice(0, steps.total).map((label, i) => {
          const n = i + 1
          const state = cur === n ? 'now' : steps.seen.has(n) ? 'done' : 'next'
          return (
            <li key={n} className={state}>
              <button type="button" onClick={() => steps.go(n)} aria-current={cur === n ? 'step' : undefined}>
                <span className="io-progress-n" aria-hidden>{state === 'done' ? <CheckIcon /> : n}</span>
                <span className="io-progress-l">{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function StepCard({ steps, n, title, note, children }: { steps: Steps; n: number; title: string; note?: ReactNode; children: ReactNode }) {
  const open = steps.open === n
  const bodyId = useId()
  return (
    <div className={`io-step${open ? ' open' : ''}`} data-io-step={n}>
      <button type="button" className="io-step-head" aria-expanded={open} aria-controls={bodyId} onClick={() => steps.toggle(n)}>
        <span className="io-step-n">{steps.seen.has(n) && !open ? <CheckIcon /> : n}</span>
        <span className="io-step-title">{title}</span>
        {note != null && <span className="io-step-note">{note}</span>}
        <span className="io-caret" aria-hidden>▸</span>
      </button>
      <div className="io-step-body" id={bodyId} hidden={!open}>
        {children}
      </div>
    </div>
  )
}

export function StepNav({ steps, n, nextLabel, lastLabel = 'See the results on the right' }: { steps: Steps; n: number; nextLabel?: string; lastLabel?: string }) {
  const last = n >= steps.total
  return (
    <div className="io-nav">
      {n > 1 ? <button type="button" className="io-nav-back" onClick={() => steps.go(n - 1)}>← Back</button> : <span />}
      {last ? (
        <button type="button" className="io-nav-next" onClick={() => document.querySelector('.io-out')?.scrollTo({ top: 0, behavior: 'smooth' })}>{lastLabel}</button>
      ) : (
        <button type="button" className="io-nav-next" onClick={() => steps.go(n + 1)}>{nextLabel ?? `Next: step ${n + 1}`} →</button>
      )}
    </div>
  )
}

/** A short "what to do here" note at the top of a step. Hidden with the bulbs when Guides is off. */
export function WhatToDo({ children }: { children: ReactNode }) {
  if (!useGuidesOn()) return null
  return <p className="io-todo"><strong>What to do.</strong> {children}</p>
}

export function FieldLegend({ onReset, dirty }: { onReset: () => void; dirty: boolean }) {
  return (
    <div className="io-legend">
      <span className="io-lg"><span className="io-sw preset" /> Yellow: a preset value from a source or a stated assumption</span>
      <span className="io-lg"><span className="io-sw edited" /> Green: a value you changed</span>
      <button type="button" className="io-reset-all" onClick={onReset} disabled={!dirty}><ResetIcon /> Reset all</button>
    </div>
  )
}

// ---------------- fields ----------------

function Tip({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null)
  const W = 280
  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const left = Math.max(8, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 8))
    const above = r.top > 200
    setPos({ top: above ? r.top - 8 : r.bottom + 8, left, above })
  }
  return (
    <span className="io-tip" ref={ref} tabIndex={0} role="img" aria-label={text} onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}>
      i
      {pos && createPortal(
        <span className="io-tip-pop" style={{ top: pos.top, left: pos.left, width: W, transform: pos.above ? 'translateY(-100%)' : undefined }}>{text}</span>,
        document.body,
      )}
    </span>
  )
}

const tidy = (v: number, dp: number) => String(+v.toFixed(dp))

/** A number input. Yellow while it holds its preset, green once changed. `scale` shows a fraction as a percentage. */
export function NumField({ field, label, value, preset, onChange, unit, step = 1, min = 0, max, scale = 1, dp = 2, tip, hint, source, disabled }: {
  field: string; label: string; value: number; preset: number; onChange: (v: number) => void; unit?: string; step?: number
  min?: number; max?: number; scale?: number; dp?: number; tip?: string; hint?: ReactNode; source?: ReactNode; disabled?: boolean
}) {
  const shown = value * scale
  const [text, setText] = useState(tidy(shown, dp))
  const [focus, setFocus] = useState(false)
  useLayoutEffect(() => {
    if (!focus) setText(tidy(shown, dp))
  }, [shown, dp, focus])
  const edited = Math.abs(value - preset) > 1e-9
  const id = useId()
  const commit = (s: string) => {
    setText(s)
    const v = parseFloat(s)
    if (!Number.isFinite(v)) return
    const clamped = Math.max(min, max !== undefined ? Math.min(max, v) : v)
    onChange(clamped / scale)
  }
  return (
    <div className={`io-field${disabled ? ' off' : ''}`} data-field={field}>
      <label className="io-label" htmlFor={id}>
        {label}
        {tip && <Tip text={tip} />}
      </label>
      {hint && <p className="io-hint">{hint}</p>}
      <div className="io-input-row">
        <input id={id} type="number" inputMode="decimal" className={`io-input ${edited ? 'edited' : 'preset'}`} value={text} step={step} min={min} max={max}
          disabled={disabled} onFocus={() => setFocus(true)} onBlur={() => { setFocus(false); setText(tidy(value * scale, dp)) }}
          onChange={(e) => commit(e.target.value)} />
        {unit && <span className="io-unit">{unit}</span>}
        {edited && !disabled && (
          <button type="button" className="io-undo" onClick={() => onChange(preset)} title={`Back to the preset, ${tidy(preset * scale, dp)}${unit ? ' ' + unit : ''}`}>
            <ResetIcon /> preset {tidy(preset * scale, dp)}
          </button>
        )}
      </div>
      {source && <div className="io-source">{source}</div>}
    </div>
  )
}

/** A choice between a few options, shown as joined buttons (like OxyCost's On rent / Purchased). */
export function ChoiceField<K extends string>({ field, label, options, value, preset, onChange, tip, hint }: {
  field: string; label: string; options: { key: K; label: string }[]; value: K; preset: K; onChange: (k: K) => void; tip?: string; hint?: ReactNode
}) {
  return (
    <div className="io-field" data-field={field}>
      <span className="io-label">
        {label}
        {tip && <Tip text={tip} />}
      </span>
      <div className={`io-seg${value !== preset ? ' edited' : ''}`} role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.key} type="button" aria-pressed={value === o.key} className={value === o.key ? 'on' : ''} onClick={() => onChange(o.key)}>
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="io-hint">{hint}</p>}
    </div>
  )
}

export function CheckField({ field, label, checked, preset, onChange, hint }: {
  field: string; label: ReactNode; checked: boolean; preset: boolean; onChange: (v: boolean) => void; hint?: ReactNode
}) {
  return (
    <div className="io-field io-check" data-field={field}>
      <label className={checked !== preset ? 'edited' : ''}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
      {hint && <p className="io-hint">{hint}</p>}
    </div>
  )
}

// ---------------- output ----------------

/** A section of the Output column that can be folded away. */
export function OutSection({ title, note, defaultOpen = true, step, children }: {
  title: string; note?: ReactNode; defaultOpen?: boolean; step?: string; children: ReactNode
}) {
  return (
    <details className="io-sec" open={defaultOpen} data-step={step}>
      <summary className="io-sec-head">
        <span className="io-caret" aria-hidden>▸</span>
        <span className="io-sec-title">{title}</span>
        {note != null && <span className="io-sec-note">{note}</span>}
      </summary>
      <div className="io-sec-body">{children}</div>
    </details>
  )
}

export function Insight({ children }: { children: ReactNode }) {
  return (
    <p className="io-insight">
      <span className="io-insight-tag">Insight</span>
      <span>{children}</span>
    </p>
  )
}

/** A piece of a calculation: plain text, or a value. A value with `field` is a pill that jumps to its input. */
export type Part = string | { t: string; field?: string }
export const pill = (t: string, field?: string): Part => ({ t, field })

export function Formula({ parts }: { parts: Part[] }) {
  const scope = useScope()
  return (
    <span className="io-formula">
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : p.field ? (
          <button key={i} type="button" className="io-pill" onClick={() => goToField(scope, p.field!)} title="Go to this input on the left">
            {p.t}
          </button>
        ) : (
          <span key={i} className="io-pill static" title="Worked out by the tool for this line; it is not an input you can change here">{p.t}</span>
        ),
      )}
    </span>
  )
}

export interface DrillRow {
  name: ReactNode
  tag?: string
  parts: Part[]
  value: string
  total?: boolean
}

/** A numbered group of calculation rows: name, the formula with its numbers, and the result. */
export function DrillBlock({ label, rows }: { label: string; rows: DrillRow[] }) {
  return (
    <>
      <div className="io-drill-label">{label}</div>
      <table className="io-drill">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.total ? 'total' : undefined}>
              <th scope="row">
                {r.name}
                {r.tag && <span className="io-drill-tag">{r.tag}</span>}
              </th>
              <td><Formula parts={r.parts} /></td>
              <td className="io-drill-val">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export function Drill({ title, controls, children, foot }: { title: ReactNode; controls?: ReactNode; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="io-drill-card" data-tour="io-drill">
      <div className="io-drill-head">
        <span className="io-drill-title">{title}</span>
        {controls}
      </div>
      {children}
      <p className="io-drill-key">
        <span className="io-pill demo">yellow</span> values are inputs you can change: click one to go to it on the left. Plain numbers come from the data or from an earlier row.
      </p>
      {foot}
    </div>
  )
}

/** The joined buttons above a calculation that pick what it is shown for (a facility level, a line). */
export function Picker<K extends string>({ label, options, value, onChange }: { label: string; options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="io-picker">
      <span className="io-picker-label">{label}</span>
      <div className="io-seg small" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.key} type="button" aria-pressed={value === o.key} className={value === o.key ? 'on' : ''} onClick={() => onChange(o.key)}>{o.label}</button>
        ))}
      </div>
    </div>
  )
}

/** India or one state, for calculations that can be shown for either. */
export function GeoSelect({ value, states, onChange }: { value: string; states: string[]; onChange: (v: string) => void }) {
  return (
    <label className="io-picker">
      <span className="io-picker-label">Show for</span>
      <select className="io-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="India">India</option>
        {states.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>
  )
}

export function Kpis({ items }: { items: { label: string; value: string; sub: string; main?: boolean }[] }) {
  return (
    <div className="io-kpis">
      {items.map((k) => (
        <div key={k.label} className={`io-kpi${k.main ? ' main' : ''}`}>
          <div className="io-kpi-label">{k.label}</div>
          <div className="io-kpi-value">{k.value}</div>
          <div className="io-kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  )
}
