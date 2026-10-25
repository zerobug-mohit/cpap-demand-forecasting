import { useMemo, useState } from 'react'
import type { Norms } from '../../engine/method1'
import type { M2Norms } from '../../engine/method2'
import type { M3Norms } from '../../engine/method3'
import { compare } from '../../engine/compare'
import { fmt } from '../../utils/format'
import type { Place } from '../../data/guide'
import Comparison from '../Comparison'
import type { NeedBasis } from '../Comparison'
import { ArrowRightIcon } from '../Icon'
import { IoPage, useSteps, StepProgress, StepCard, StepNav, WhatToDo, ChoiceField, Insight } from '../io/Io'

const BASES: { key: NeedBasis; label: string }[] = [
  { key: 'rds', label: 'RDS-based need' },
  { key: 'facility', label: 'Facility-based need' },
]

export default function ComparePage({ m1, m2, m3, onOpen }: { m1: Norms; m2: M2Norms; m3: M3Norms; onOpen: (p: Place) => void }) {
  const { rows, nat } = useMemo(() => compare(m1, m2, m3), [m1, m2, m3])
  const steps = useSteps('cmp', 3)
  const [scope, setScope] = useState('national')
  const [basis, setBasis] = useState<NeedBasis>('rds')
  const names = useMemo(() => rows.map((r) => r.state).sort((a, b) => a.localeCompare(b)), [rows])
  const sel = scope === 'national' ? null : rows.find((r) => r.state === scope) ?? null
  const v = sel ? { guid: sel.buExisting, rds: sel.td, fac: sel.tdFacility, inst: sel.installed } : { guid: nat.buExisting, rds: nat.td, fac: nat.tdFacility, inst: undefined }
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)
  const reporting = rows.filter((r) => r.installed != null && r.installed > 0)

  const SOURCES = [
    { name: 'Guidelines-based current demand', value: v.guid, place: { section: 'estimation', sub: 'bu' } as Place },
    { name: 'Epidemiological need: RDS-based', value: v.rds, place: { section: 'estimation', sub: 'td', td: 'rds' } as Place },
    { name: 'Epidemiological need: facility-based', value: v.fac, place: { section: 'estimation', sub: 'td', td: 'facility' } as Place },
  ]

  const inputs = (
    <>
      <StepProgress steps={steps} labels={['Choose an area', 'Choose the need', 'Where the numbers come from']} />

      <StepCard steps={steps} n={1} title="Choose an area" note={sel ? sel.state : 'India'}>
        <WhatToDo>Pick India or one state. Every result on the right is then shown for that area.</WhatToDo>
        <div className="io-field" data-field="area">
          <label className="io-label" htmlFor="cmp-area">Area</label>
          <select id="cmp-area" className="io-select wide" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="national">India</option>
            {names.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <StepNav steps={steps} n={1} nextLabel="Next: choose the need" />
      </StepCard>

      <StepCard steps={steps} n={2} title="Choose the need to compare against" note={BASES.find((b) => b.key === basis)?.label}>
        <WhatToDo>The state chart on the right compares current demand with one estimate of need. Choose which one.</WhatToDo>
        <ChoiceField field="basis" label="Compare current demand with" options={BASES} value={basis} preset="rds" onChange={setBasis}
          hint="The two estimates of need are worked out in different ways, so treat the range between them as the likely range." />
        <StepNav steps={steps} n={2} nextLabel="Next: where the numbers come from" />
      </StepCard>

      <StepCard steps={steps} n={3} title="Where the numbers come from" note="three public approaches">
        <WhatToDo>This page has no inputs of its own. Each figure comes from an approach on another tab. Open an approach to change its inputs, then come back here.</WhatToDo>
        <ul className="io-links">
          {SOURCES.map((s) => (
            <li key={s.name}>
              <span className="io-links-name">{s.name}</span>
              <span className="io-links-val">{fmt(s.value)}</span>
              <button type="button" className="io-link-btn" onClick={() => onOpen(s.place)}>Change its inputs <ArrowRightIcon /></button>
            </li>
          ))}
        </ul>
        <StepNav steps={steps} n={3} />
      </StepCard>
    </>
  )

  const output = (
    <>
      <Insight>
        In {sel ? sel.state : 'India'}, the current demand of today’s SNCUs ({fmt(v.guid)} machines) is {pct(v.guid, v.rds)}% of the RDS-based need
        ({fmt(v.rds)}) and {pct(v.guid, v.fac)}% of the facility-based need ({fmt(v.fac)}).
        {v.inst != null && v.inst > 0
          ? <> {sel?.state} reports {fmt(v.inst)} machines installed, {pct(v.inst, v.guid)}% of its current demand.</>
          : !sel && <> {reporting.length} states report how many machines are installed; pick one of them to see its count.</>}
      </Insight>
      <Comparison m1={m1} m2={m2} m3={m3} scope={scope} onScope={setScope} needBasis={basis} onNeedBasis={setBasis} inputsOutside />
    </>
  )

  return <IoPage scope="cmp" inputs={inputs} output={output} />
}
