import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { STATES } from '../../data/states'
import { IDR_BY_STATE, PUBLIC_SHARE_BY_STATE } from '../../data/states2'
import { computeAll, DEFAULT_NORMS } from '../../engine/method1'
import type { Norms } from '../../engine/method1'
import { fmt } from '../../utils/format'
import SourceNote from '../SourceNote'
import DataExplorer from '../DataExplorer'
import MethodologyCard from '../MethodologyCard'
import {
  IoPage, useSteps, StepProgress, StepCard, StepNav, WhatToDo, FieldLegend, NumField,
  OutSection, Insight, Drill, DrillBlock, GeoSelect, Kpis, pill,
} from '../io/Io'

// Guidelines-based current demand counts SNCUs only, as the FBNC guidelines do. The engine's optional
// NBSU and transport add-ons are not offered on this page, so the scope is always held at SNCUs only.
const pct = (v: number) => `${+(v * 100).toFixed(1)}%`

export default function GuidelinesPage({ norms: given, onChange, top }: { norms: Norms; onChange: (n: Norms) => void; top?: ReactNode }) {
  const norms: Norms = given.scope === 'sncu' ? given : { ...given, scope: 'sncu' }
  const { rows, totals } = useMemo(() => computeAll(STATES, norms, IDR_BY_STATE, PUBLIC_SHARE_BY_STATE), [norms])
  const D = DEFAULT_NORMS
  const set = (patch: Partial<Norms>) => onChange({ ...norms, ...patch })
  const steps = useSteps('bu', 2)
  const dirty = norms.avgSncuBeds !== D.avgSncuBeds || norms.cpapPerBed !== D.cpapPerBed || norms.buffer !== D.buffer
  const [geo, setGeo] = useState('India')
  const stateNames = useMemo(() => rows.map((r) => r.state).sort((a, b) => a.localeCompare(b)), [rows])

  const g = geo === 'India' ? totals : rows.find((r) => r.state === geo) ?? totals
  const perSncu = g.sncu > 0 ? g.asisCpap / g.sncu : 0
  const reporting = rows.filter((r) => r.installed != null)
  const installed = reporting.reduce((a, r) => a + (r.installed ?? 0), 0)
  const neededThere = reporting.reduce((a, r) => a + r.asisCpap, 0)

  const inputs = (
    <>
      {top}
      <StepProgress steps={steps} labels={['SNCU norms', 'Planning buffer']} />
      <FieldLegend dirty={dirty} onReset={() => onChange(D)} />

      <StepCard steps={steps} n={1} title="SNCU norms" note={`${norms.avgSncuBeds} beds × ${norms.cpapPerBed.toFixed(2)}`}>
        <WhatToDo>
          Check the two values that turn the number of special newborn care units (SNCUs) into CPAP machines. Change them
          if you know better values. Only SNCUs are counted, as in the FBNC guidelines.
        </WhatToDo>
        <NumField field="avgSncuBeds" label="Average beds per SNCU" value={norms.avgSncuBeds} preset={D.avgSncuBeds} unit="beds" step={1} min={1} max={60} dp={0}
          onChange={(v) => set({ avgSncuBeds: v })}
          tip="Beds per SNCU are not published, so total beds = SNCUs × this average. This is the biggest single assumption in this approach."
          source={<SourceNote refs={[{ key: 'nhmSncu2013', page: 'p. 6' }, { key: 'fbnc2025', page: 'p. 21' }]} />} />
        <NumField field="cpapPerBed" label="CPAP machines per SNCU bed" value={norms.cpapPerBed} preset={D.cpapPerBed} unit="per bed" step={0.05} max={1}
          onChange={(v) => set({ cpapPerBed: v })}
          tip="FBNC 2025 says about 30% of SNCU beds should have a CPAP machine, about 4 in a 12-bed unit."
          source={<SourceNote refs={[{ key: 'fbnc2025', page: 'p. 57, 60' }]} />} />
        <StepNav steps={steps} n={1} nextLabel="Next: planning buffer" />
      </StepCard>

      <StepCard steps={steps} n={2} title="Planning buffer" note={pct(norms.buffer)}>
        <WhatToDo>Set the extra share added on top of the machines from the norm. Set it to 0% to see the norm alone.</WhatToDo>
        <NumField field="buffer" label="Planning buffer" value={norms.buffer} preset={D.buffer} unit="%" scale={100} step={5} max={100} dp={0}
          onChange={(v) => set({ buffer: v })}
          tip="It covers busy periods, machines that break or wear out, and the time it takes to order replacements. The other public approaches use the same 25%."
          hint="It is added to each state’s total." />
        <StepNav steps={steps} n={2} />
      </StepCard>
    </>
  )

  const output = (
    <>
      <OutSection title="Result" step="o-bu-result" note={`${fmt(totals.asisCpap)} machines`}>
        <Kpis items={[
          { label: 'CPAP machines needed', value: fmt(totals.asisCpap), sub: 'for today’s SNCUs under the FBNC norm, with the buffer', main: true },
          { label: 'SNCU beds', value: fmt(totals.asisBeds), sub: 'SNCUs × average beds' },
          { label: 'SNCUs', value: fmt(totals.sncu), sub: 'in operation, October 2024, NICUs included' },
          { label: 'CPAP per SNCU', value: (totals.asisCpap / (totals.sncu || 1)).toFixed(1), sub: 'on average, with the buffer' },
        ]} />
        <Insight>
          Today’s {fmt(totals.sncu)} SNCUs need {fmt(totals.asisCpap)} CPAP machines, about {(totals.asisCpap / (totals.sncu || 1)).toFixed(1)} per
          SNCU. The {reporting.length} states that report installed machines have {fmt(installed)} installed, which
          is {Math.round((installed / (neededThere || 1)) * 100)}% of the {fmt(neededThere)} this approach gives them.
        </Insight>
      </OutSection>

      <OutSection title="How the number is worked out" step="o-bu-how">
        <Drill title="Guidelines-based current demand" controls={<GeoSelect value={geo} states={stateNames} onChange={setGeo} />}
          foot={geo === 'India' ? <p className="io-drill-foot">India is the sum of the 36 states and union territories, each worked out and rounded to whole machines on its own.</p> : undefined}>
          <DrillBlock label="1 · Beds in today’s SNCUs" rows={[
            { name: 'SNCU beds', parts: [`${fmt(g.sncu)} SNCUs × `, pill(`${norms.avgSncuBeds} beds`, 'avgSncuBeds')], value: fmt(g.asisBeds) },
          ]} />
          <DrillBlock label="2 · CPAP machines from the norm" rows={[
            { name: 'CPAP at SNCUs', parts: [`${fmt(g.asisBeds)} beds × `, pill(`${norms.cpapPerBed.toFixed(2)} CPAP per bed`, 'cpapPerBed')], value: fmt(g.asisSncuCpap) },
          ]} />
          <DrillBlock label="3 · With the planning buffer" rows={[
            { name: 'CPAP machines needed', parts: [`${fmt(g.asisSncuCpap)} × (1 + `, pill(`${pct(norms.buffer)} buffer`, 'buffer'), ')'], value: fmt(g.asisCpap), total: true },
            { name: 'CPAP per SNCU', parts: [`${fmt(g.asisCpap)} ÷ ${fmt(g.sncu)} SNCUs`], value: perSncu.toFixed(1) },
          ]} />
        </Drill>
      </OutSection>

      <OutSection title="State by state" step="o-bu-states">
        <DataExplorer rows={rows} totals={totals} showExt={false} />
      </OutSection>

      <OutSection title="Method and sources" step="o-bu-sources" defaultOpen={false}>
        <MethodologyCard />
      </OutSection>
    </>
  )

  return <IoPage scope="bu" inputs={inputs} output={output} />
}
