import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { computeM3, DEFAULT_M3 } from '../../engine/method3'
import type { Burden, M3Norms } from '../../engine/method3'
import { fmt } from '../../utils/format'
import SourceNote from '../SourceNote'
import EpiFacilityStates from '../EpiFacilityStates'
import {
  IoPage, useSteps, StepProgress, StepCard, StepNav, WhatToDo, FieldLegend, NumField, CheckField,
  OutSection, Insight, Drill, DrillBlock, Picker, Kpis, pill,
} from '../io/Io'
import type { DrillRow } from '../io/Io'

const TIERS: { key: Burden; label: string }[] = [
  { key: 'high', label: 'High workload (over 3,000 a year)' },
  { key: 'med', label: 'Medium workload (1,000 to 3,000)' },
  { key: 'low', label: 'Low workload (under 1,000)' },
]
const SHORT: Record<string, string> = { dh: 'DHs', mc: 'MCs', sdh: 'SDHs', chc: 'CHCs' }
const AVG_LABEL: Record<Burden, string> = { high: 'High workload', med: 'Medium workload', low: 'Low workload' }
const DEC1 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dec1 = (v: number) => DEC1.format(v)

export default function FacilityPage({ norms, onChange, top }: { norms: M3Norms; onChange: (n: M3Norms) => void; top?: ReactNode }) {
  const r = useMemo(() => computeM3(norms), [norms])
  const D = DEFAULT_M3
  const steps = useSteps('fac', 4)
  const dirty = JSON.stringify(norms) !== JSON.stringify(D)
  const included = norms.levels.filter((l) => l.inc)
  const [lvl, setLvl] = useState('chc')
  const sel = norms.levels.find((l) => l.key === lvl && l.inc) ?? included[0]

  const setLevel = (i: number, patch: Partial<M3Norms['levels'][number]>) =>
    onChange({ ...norms, levels: norms.levels.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const setTier = (i: number, which: Exclude<Burden, 'low'>, v: number) => {
    const t = { ...norms.levels[i].tiers, [which]: Math.max(0, Math.min(100, v)) }
    t.low = Math.max(0, 100 - t.high - t.med)
    setLevel(i, { tiers: t })
  }
  const setAvg = (key: Burden, v: number) => onChange({ ...norms, avg: { ...norms.avg, [key]: v } })

  // the calculation for the chosen facility level
  const section = sel ? r.sections.find((s) => s.key === sel.key) : undefined
  const tierRows = section?.tiers ?? []
  const tierKey = (label: string) => TIERS.find((t) => label.startsWith(t.label.split(' ')[0]))?.key ?? 'low'
  const facRows: DrillRow[] = []
  const delRows: DrillRow[] = []
  const devRows: DrillRow[] = []
  if (sel && section) {
    const nHigh = tierRows.find((t) => tierKey(t.label) === 'high')?.facilities ?? 0
    const nMed = tierRows.find((t) => tierKey(t.label) === 'med')?.facilities ?? 0
    const norm = sel.beds * sel.cpapPerBed
    for (const t of tierRows) {
      const k = tierKey(t.label)
      const name = TIERS.find((x) => x.key === k)!.label
      const count = pill(`${fmt(sel.count)} ${SHORT[sel.key]}`, `${sel.key}.count`)
      if (k === 'low') facRows.push({ name, parts: [`${fmt(sel.count)} − ${fmt(nHigh)} − ${fmt(nMed)} (the rest)`], value: fmt(t.facilities) })
      else if (sel.lock) facRows.push({ name, parts: [count, ' × 100% (fixed: the top level of newborn care)'], value: fmt(t.facilities) })
      else facRows.push({ name, parts: [count, ' × ', pill(`${sel.tiers[k]}% ${k === 'high' ? 'high' : 'medium'}`, `${sel.key}.${k}`)], value: fmt(t.facilities) })
      delRows.push({ name, parts: [`${fmt(t.facilities)} × `, pill(`${fmt(norms.avg[k])} deliveries`, `avg.${k}`)], value: fmt(t.deliveries) })
      const fromNorm = (t.deliveries * norm) / 1000
      devRows.push({
        name, tag: t.floored ? 'at least 1 each' : undefined,
        parts: [`${fmt(t.deliveries)} × `, pill(`${sel.beds} beds`, `${sel.key}.beds`), ' × ', pill(`${sel.cpapPerBed.toFixed(2)} CPAP per bed`, `${sel.key}.cpapPerBed`), ' ÷ 1,000',
          ...(sel.floorOne ? [` = ${dec1(fromNorm)}, or one for each of the ${fmt(t.facilities)} facilities if that is more`] : [])],
        value: t.devices % 1 === 0 ? fmt(t.devices) : dec1(t.devices),
      })
    }
    devRows.push({ name: `${sel.name}, before the buffer`, parts: ['the rows above, added up'], value: dec1(section.devices), total: true })
  }
  const largest = [...r.sections].filter((s) => !s.excluded).sort((a, b) => b.devices - a.devices)[0]
  const floored = largest ? largest.tiers.filter((t) => t.floored).reduce((a, t) => a + t.devices, 0) : 0

  const inputs = (
    <>
      {top}
      <StepProgress steps={steps} labels={['The FBNC norm', 'Facilities and workload', 'Average deliveries', 'Planning buffer']} />
      <FieldLegend dirty={dirty} onReset={() => onChange(D)} />

      <StepCard steps={steps} n={1} title="The FBNC norm for each level" note={`${(norms.levels[0].beds * norms.levels[0].cpapPerBed).toFixed(1)} per 1,000 deliveries`}>
        <WhatToDo>
          For each level of public facility, check the SNCU beds per 1,000 deliveries and the CPAP machines per bed.
          Their product is the machines needed per 1,000 deliveries. Untick a level to leave it out.
        </WhatToDo>
        {norms.levels.map((l, i) => (
          <div key={l.key} className={`io-group${l.inc ? '' : ' off'}`}>
            <CheckField field={`${l.key}.inc`} checked={l.inc} preset={D.levels[i].inc} onChange={(inc) => setLevel(i, { inc })}
              label={<><strong>{l.name}</strong> · {(l.beds * l.cpapPerBed).toFixed(2)} CPAP per 1,000 deliveries{l.fbnc ? ' · FBNC' : ''}</>} />
            <div className="io-row2">
              <NumField field={`${l.key}.beds`} label="SNCU beds per 1,000 deliveries" value={l.beds} preset={D.levels[i].beds} unit="beds" step={0.5} disabled={!l.inc}
                onChange={(beds) => setLevel(i, { beds })} />
              <NumField field={`${l.key}.cpapPerBed`} label="CPAP per bed" value={l.cpapPerBed} preset={D.levels[i].cpapPerBed} unit="per bed" step={0.05} max={1} disabled={!l.inc}
                onChange={(cpapPerBed) => setLevel(i, { cpapPerBed })} />
            </div>
          </div>
        ))}
        <SourceNote refs={[{ key: 'fbnc2025', page: 'p. 28, 57–60' }]} note="4 SNCU beds per 1,000 deliveries, with CPAP for 30% of beds" />
        <p className="io-hint io-rule">
          <strong>At least one machine per SDH and CHC.</strong> For sub-district hospitals and community health centres,
          each workload group gets the larger of two numbers: its number of facilities, or the machines from the norm. So
          facilities with few deliveries still get one machine each.
        </p>
        <StepNav steps={steps} n={1} nextLabel="Next: facilities and workload" />
      </StepCard>

      <StepCard steps={steps} n={2} title="Facilities and workload" note={`${fmt(r.totals.facilities)} facilities`}>
        <WhatToDo>Check how many facilities each level has, and what share of them do many or few deliveries a year. The low-workload share is the rest.</WhatToDo>
        {norms.levels.map((l, i) => (
          <div key={l.key} className={`io-group${l.inc ? '' : ' off'}`}>
            <div className="io-group-title">{l.name}</div>
            <div className="io-row3">
              <NumField field={`${l.key}.count`} label="Facilities" value={l.count} preset={D.levels[i].count} step={1} dp={0} disabled={!l.inc}
                onChange={(v) => setLevel(i, { count: Math.round(v) })} />
              <NumField field={`${l.key}.high`} label="High workload" value={l.tiers.high} preset={D.levels[i].tiers.high} unit="%" step={5} max={100} dp={0}
                disabled={!l.inc || l.lock} onChange={(v) => setTier(i, 'high', v)} />
              <NumField field={`${l.key}.med`} label="Medium workload" value={l.tiers.med} preset={D.levels[i].tiers.med} unit="%" step={5} max={100} dp={0}
                disabled={!l.inc || l.lock} onChange={(v) => setTier(i, 'med', v)} />
            </div>
            <p className="io-hint">
              {l.lock ? 'Held at 100% high: under FBNC these are the top level of newborn care, whatever their deliveries.' : `Low workload: ${l.tiers.low}%, the rest.`}
            </p>
          </div>
        ))}
        <SourceNote refs={[{ key: 'healthDynamics', page: 'DH 714 · SDH 1,340 · CHC 6,359' }, { key: 'nmcColleges', page: 'about 362 government' }]}
          note="facility counts; the workload split is an assumption" />
        <StepNav steps={steps} n={2} nextLabel="Next: average deliveries" />
      </StepCard>

      <StepCard steps={steps} n={3} title="Average deliveries per facility" note={`${fmt(norms.avg.high)} · ${fmt(norms.avg.med)} · ${fmt(norms.avg.low)}`}>
        <WhatToDo>Check how many deliveries an average facility does in a year in each workload group.</WhatToDo>
        {(['high', 'med', 'low'] as Burden[]).map((k) => (
          <NumField key={k} field={`avg.${k}`} label={AVG_LABEL[k]} value={norms.avg[k]} preset={D.avg[k]} unit="deliveries a year" step={k === 'low' ? 50 : 250} dp={0}
            onChange={(v) => setAvg(k, v)} />
        ))}
        <SourceNote refs={[{ key: 'fbnc2025', page: 'workload cutoffs' }, { key: 'sharmaBmj', page: 'CHC about 490 a year' }]}
          note="the low average is based on a typical CHC; the high and medium averages are assumptions" />
        <StepNav steps={steps} n={3} nextLabel="Next: planning buffer" />
      </StepCard>

      <StepCard steps={steps} n={4} title="Planning buffer" note={`${Math.round(norms.buffer * 100)}%`}>
        <WhatToDo>Set the extra share added to the final total for busy periods, breakdowns and the time to order replacements.</WhatToDo>
        <NumField field="buffer" label="Planning buffer" value={norms.buffer} preset={D.buffer} unit="%" scale={100} step={5} max={100} dp={0}
          onChange={(buffer) => onChange({ ...norms, buffer })} />
        <StepNav steps={steps} n={4} />
      </StepCard>
    </>
  )

  const output = (
    <>
      <OutSection title="Result" step="o-fac-result" note={`${fmt(r.totals.devices)} machines`}>
        <Kpis items={[
          { label: 'CPAP machines needed', value: fmt(r.totals.devices), sub: 'public delivery network, with the buffer', main: true },
          { label: 'Deliveries counted', value: fmt(r.totals.deliveries), sub: 'facilities × average deliveries' },
          { label: 'Facilities counted', value: fmt(r.totals.facilities), sub: 'in the included levels' },
        ]} />
        {largest && (
          <Insight>
            {largest.name} need the most machines: {fmt(largest.devices)} of the {fmt(r.totals.rawDevices)} before the buffer
            ({Math.round((largest.devices / (r.totals.rawDevices || 1)) * 100)}%).
            {floored > 0 && <> {fmt(floored)} of them come from the rule that every facility gets at least one machine.</>}
          </Insight>
        )}
      </OutSection>

      <OutSection title="How the number is worked out" step="o-fac-how">
        <Drill title="Facility-based need"
          controls={<Picker label="Facility level" value={sel?.key ?? 'chc'} onChange={setLvl}
            options={included.map((l) => ({ key: l.key, label: SHORT[l.key] }))} />}>
          {sel && section ? (
            <>
              <div className="io-drill-sub">{sel.name}</div>
              <DrillBlock label="1 · Facilities in each workload group" rows={facRows} />
              <DrillBlock label="2 · Deliveries a year" rows={delRows} />
              <DrillBlock label={sel.floorOne ? '3 · CPAP machines (at least one per facility)' : '3 · CPAP machines from the norm'} rows={devRows} />
            </>
          ) : <p className="io-hint">No facility level is included. Tick one in step 1.</p>}
          <div className="io-drill-sub">India, all included levels</div>
          <DrillBlock label="4 · Total with the planning buffer" rows={[
            { name: 'Before the buffer', parts: [r.sections.filter((s) => !s.excluded).map((s) => `${SHORT[s.key]} ${dec1(s.devices)}`).join(' + ')], value: dec1(r.totals.rawDevices) },
            { name: 'CPAP machines needed', parts: [`${dec1(r.totals.rawDevices)} × (1 + `, pill(`${Math.round(norms.buffer * 100)}% buffer`, 'buffer'), '), rounded'], value: fmt(r.totals.devices), total: true },
          ]} />
        </Drill>
      </OutSection>

      <OutSection title="Machines by facility level" step="o-fac-levels">
        <div className="fc-bars io-bars">
          {r.bars.map((b) => (
            <div className="fc-barrow" key={b.name}>
              <span className="fc-bname">{b.name}</span>
              <span className="fc-track"><span className="fc-fill" style={{ width: `${Math.max(2, (b.devices / r.maxBar) * 100)}%` }} /></span>
              <span className="fc-bval fc-num">{fmt(b.devices)}</span>
            </div>
          ))}
        </div>
        <p className="io-hint">Before the planning buffer.</p>
      </OutSection>

      <OutSection title="State by state" step="o-fac-states">
        <EpiFacilityStates norms={norms} />
      </OutSection>

      <OutSection title="Method and limits" step="o-fac-limits" defaultOpen={false}>
        <ul className="src-list io-list">
          <li>This is an estimate of <strong>need</strong>. It works out how many machines a fully equipped public network would need, not how many are installed today.</li>
          <li>The facility counts and the FBNC norm come from published sources. The split of facilities into high, medium and low workload groups, and the average deliveries for the high and medium groups, are assumptions, because there is no published breakdown.</li>
          <li>All district hospitals and medical colleges are in the high group, because under FBNC they are the top level of newborn care whatever their number of deliveries.</li>
          <li>Every sub-district hospital and community health centre gets at least one CPAP machine.</li>
          <li>This covers the four public levels only. It leaves out primary health centres and sub-centres. The private sector is estimated on its own tab.</li>
        </ul>
      </OutSection>
    </>
  )

  return <IoPage scope="fac" inputs={inputs} output={output} />
}
