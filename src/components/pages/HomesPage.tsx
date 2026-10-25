import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { computePrivate, DEFAULT_PRIVATE } from '../../engine/methodPrivate'
import type { PrivateNorms, PrivateTier } from '../../engine/methodPrivate'
import { fmt } from '../../utils/format'
import SourceNote from '../SourceNote'
import {
  IoPage, useSteps, StepProgress, StepCard, StepNav, WhatToDo, FieldLegend, NumField,
  OutSection, Insight, Drill, DrillBlock, Kpis, pill,
} from '../io/Io'

const GROUP = ['Homes with an SNCU of 3 or more beds', 'Homes with an SNCU of 1 to 2 beds', 'Small homes with a basic setup']
const SHORT = ['High', 'Medium', 'Small']

export default function HomesPage({ norms, onChange, top }: { norms: PrivateNorms; onChange: (n: PrivateNorms) => void; top?: ReactNode }) {
  const r = useMemo(() => computePrivate(norms), [norms])
  const D = DEFAULT_PRIVATE
  const steps = useSteps('homes', 2)
  const dirty = JSON.stringify(norms) !== JSON.stringify(D)
  const setTier = (i: number, patch: Partial<PrivateTier>) => onChange({ ...norms, tiers: norms.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) })
  const biggest = [...r.tiers].sort((a, b) => b.devices - a.devices)[0]

  const inputs = (
    <>
      {top}
      <StepProgress steps={steps} labels={['Homes by size group', 'Homes doing deliveries']} />
      <FieldLegend dirty={dirty} onReset={() => onChange(D)} />

      <StepCard steps={steps} n={1} title="Homes by size group" note={`${fmt(r.homesTotal)} homes`}>
        <WhatToDo>
          Set how many private maternity homes there are in each size group, and how many CPAP machines each home should
          have. There is no official count, so these are assumptions. Change them to match what you know.
        </WhatToDo>
        {norms.tiers.map((t, i) => (
          <div key={t.name} className="io-group">
            <div className="io-group-title">{GROUP[i] ?? t.name}</div>
            <div className="io-row2">
              <NumField field={`tier${i}.count`} label="Maternity homes" value={t.count} preset={D.tiers[i].count} unit="homes" step={500} dp={0}
                onChange={(v) => setTier(i, { count: Math.round(v) })} />
              <NumField field={`tier${i}.cpap`} label="CPAP per home" value={t.cpap} preset={D.tiers[i].cpap} unit="each" step={0.5} dp={1}
                onChange={(v) => setTier(i, { cpap: v })} />
            </div>
          </div>
        ))}
        <SourceNote refs={[{ key: 'indiaHospEco', page: 'nursing homes under 30 beds' }, { key: 'manyata', page: 'size mix' }]}
          note="private nursing homes with fewer than 30 beds number about 35,000 to 40,000; the split into groups is an assumption" />
        <StepNav steps={steps} n={1} nextLabel="Next: homes doing deliveries" />
      </StepCard>

      <StepCard steps={steps} n={2} title="Homes doing deliveries" note={`${norms.deliveryPct}%`}>
        <WhatToDo>Set the share of homes that actually deliver babies. Lower it if some homes do not deliver or are not fully equipped.</WhatToDo>
        <NumField field="deliveryPct" label="Homes doing deliveries" value={norms.deliveryPct} preset={D.deliveryPct} unit="%" step={5} max={100} dp={0}
          onChange={(v) => onChange({ ...norms, deliveryPct: v })} hint="The preset, 100%, assumes every home does deliveries." />
        <StepNav steps={steps} n={2} />
      </StepCard>
    </>
  )

  const output = (
    <>
      <OutSection title="Result" step="o-homes-result" note={`${fmt(r.devices)} machines`}>
        <Kpis items={[
          { label: 'CPAP machines needed', value: fmt(r.devices), sub: 'in private maternity homes; no buffer is added', main: true },
          { label: 'Maternity homes', value: fmt(r.homesTotal), sub: 'all size groups' },
          { label: 'Homes doing deliveries', value: fmt(r.delivering), sub: 'homes × share doing deliveries' },
        ]} />
        {biggest && r.devices > 0 && (
          <Insight>
            {GROUP[r.tiers.indexOf(biggest)] ?? biggest.name} need the most machines: {fmt(biggest.devices)} of {fmt(r.devices)} ({Math.round((biggest.devices / r.devices) * 100)}%).
            This total is kept apart from the public estimates, because the government does not buy machines for private facilities.
          </Insight>
        )}
      </OutSection>

      <OutSection title="How the number is worked out" step="o-homes-how">
        <Drill title="Private maternity homes">
          <DrillBlock label="1 · Homes doing deliveries" rows={r.tiers.map((t, i) => ({
            name: SHORT[i] ?? t.name,
            parts: [pill(`${fmt(t.count)} homes`, `tier${i}.count`), ' × ', pill(`${norms.deliveryPct}% doing deliveries`, 'deliveryPct')],
            value: fmt(t.facilities),
          }))} />
          <DrillBlock label="2 · CPAP machines" rows={[
            ...r.tiers.map((t, i) => ({ name: SHORT[i] ?? t.name, parts: [`${fmt(t.facilities)} homes × `, pill(`${t.cpapPer} per home`, `tier${i}.cpap`)], value: fmt(t.devices) })),
            { name: 'CPAP machines needed', parts: ['the three groups, added up'], value: fmt(r.devices), total: true },
          ]} />
        </Drill>
      </OutSection>

      <OutSection title="By size group" step="o-homes-groups">
        <div className="fc-bars io-bars">
          {r.tiers.map((t, i) => {
            const max = Math.max(1, ...r.tiers.map((x) => x.devices))
            return (
              <div className="fc-barrow" key={t.name}>
                <span className="fc-bname">{SHORT[i] ?? t.name}</span>
                <span className="fc-track"><span className="fc-fill" style={{ width: `${Math.max(2, (t.devices / max) * 100)}%` }} /></span>
                <span className="fc-bval fc-num">{fmt(t.devices)}</span>
              </div>
            )
          })}
        </div>
      </OutSection>

      <OutSection title="Method and limits" step="o-homes-limits" defaultOpen={false}>
        <ul className="src-list io-list">
          <li>This is kept apart from the public estimates. The government does not buy machines for private facilities, but this shows the size of the private market.</li>
          <li>There is no official list of private maternity homes, so the number in each group and the machines per home are assumptions. By default, small homes with a basic setup have no CPAP.</li>
          <li>This assumes every home that does deliveries is fully equipped for its group. If only some are, lower the share doing deliveries or the machines per home.</li>
        </ul>
      </OutSection>
    </>
  )

  return <IoPage scope="homes" inputs={inputs} output={output} />
}
