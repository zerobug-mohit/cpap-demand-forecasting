import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { STATES2 } from '../../data/states2'
import { computeAll2, DEFAULT_M2, DEFAULT_M2_PRIVATE } from '../../engine/method2'
import type { M2Driver, M2Norms } from '../../engine/method2'
import { fmt } from '../../utils/format'
import SourceNote from '../SourceNote'
import M2Explorer from '../M2Explorer'
import DataCaveats from '../DataCaveats'
import {
  IoPage, useSteps, StepProgress, StepCard, StepNav, WhatToDo, FieldLegend, NumField, ChoiceField,
  OutSection, Insight, Drill, DrillBlock, GeoSelect, Kpis, pill,
} from '../io/Io'
import type { Part } from '../io/Io'

const DRIVERS: { key: M2Driver; label: string }[] = [
  { key: 'composite', label: 'Low birth weight + newborn deaths' },
  { key: 'lbw', label: 'Low birth weight only' },
  { key: 'volume', label: 'Births only' },
]
const pct = (v: number, dp = 1) => `${+(v * 100).toFixed(dp)}%`

// The RDS-based estimate, for public facilities or (sector 'private') for private ones. Births are always
// counted with each state's own NFHS-6 share of facility births; the one-share-for-every-state option is
// not offered, so it is held off here.
export default function RdsPage({ norms: given, onChange, top }: { norms: M2Norms; onChange: (n: M2Norms) => void; top?: ReactNode }) {
  const priv = given.sector === 'private'
  const norms: M2Norms = given.publicShareOverride === null && (priv || given.publicOnly) ? given : { ...given, publicOnly: true, publicShareOverride: null }
  const scope = priv ? 'prds' : 'rds'
  const sector = priv ? 'private' : 'public'
  const D = priv ? DEFAULT_M2_PRIVATE : DEFAULT_M2
  const { rows, totals } = useMemo(() => computeAll2(STATES2, norms), [norms])
  const set = (patch: Partial<M2Norms>) => onChange({ ...norms, ...patch })
  const steps = useSteps(scope, 3)
  const dirty = JSON.stringify(norms) !== JSON.stringify(D)
  const [geo, setGeo] = useState('India')
  const stateNames = useMemo(() => rows.map((r) => r.state).sort((a, b) => a.localeCompare(b)), [rows])

  // national standards for the need score, as the engine works them out (weighted by births counted)
  const std = useMemo(() => {
    const wm = (get: (r: (typeof rows)[number]) => number | null) => {
      let s = 0
      let w = 0
      for (const r of rows) {
        const v = get(r)
        if (v != null) { s += v * r.baseInstBirths; w += r.baseInstBirths }
      }
      return w > 0 ? s / w : 1
    }
    return { lbw: wm((r) => r.lbw), nmr: wm((r) => r.nmr) }
  }, [rows])
  const wSum = norms.wLbw + norms.wNmr || 1
  const top1 = [...rows].sort((a, b) => b.gross - a.gross)[0]

  const st = geo === 'India' ? null : rows.find((r) => r.state === geo) ?? null
  const shareTxt = `${sector} share`
  const birthsRow = st
    ? { name: 'Facility births counted', parts: [`${fmt(st.births)} live births × ${pct(st.idr)} born in a facility × ${pct(st.pubFactor)} ${shareTxt}`], value: fmt(st.baseInstBirths) }
    : { name: 'Facility births counted', parts: [`${fmt(totals.births)} live births × each state’s facility delivery rate × its own ${shareTxt}`], value: fmt(totals.baseInstBirths) }

  const g = st ?? totals
  const reaching = st ? st.reaching : totals.reaching
  const cpapDays = reaching * norms.durationDays
  const machineRows = [
    { name: 'Reaching a facility', parts: [`${fmt(g.eligible)} × `, pill(`${pct(norms.admissionRate, 0)} reach a facility`, 'admissionRate')], value: fmt(reaching) },
    { name: 'CPAP-days a year', parts: [`${fmt(reaching)} × `, pill(`${norms.durationDays} days on CPAP`, 'durationDays')], value: fmt(cpapDays) },
    { name: 'On CPAP on an average day', parts: [`${fmt(cpapDays)} ÷ 365 days`], value: fmt(g.meanConcurrent) },
    { name: 'CPAP machines needed', parts: [`${fmt(g.meanConcurrent)} × (1 + `, pill(`${pct(norms.buffer, 0)} buffer`, 'buffer'), st ? '), rounded up' : '), rounded up state by state'], value: fmt(g.gross), total: true },
  ]

  let scoreParts: Part[] = ['births only: every state scores 1']
  if (st && norms.driver !== 'volume') {
    const lbw = st.lbw != null ? `(LBW ${st.lbw}% ÷ national ${std.lbw.toFixed(1)}%)` : '(LBW not reported, so 1)'
    const nmr = st.nmr != null ? `(NMR ${st.nmr} ÷ national ${std.nmr.toFixed(1)})` : '(NMR not reported, so 1)'
    scoreParts = norms.driver === 'lbw'
      ? [`${lbw}`]
      : [pill((norms.wLbw / wSum).toFixed(2), 'wLbw'), ` × ${lbw} + `, pill((norms.wNmr / wSum).toFixed(2), 'wNmr'), ` × ${nmr}`]
  }

  const inputs = (
    <>
      {top}
      <StepProgress steps={steps} labels={['Newborns who need CPAP', 'From newborns to machines', 'Sharing among states']} />
      <FieldLegend dirty={dirty} onReset={() => onChange(D)} />

      <StepCard steps={steps} n={1} title="Newborns who need CPAP" note={`${norms.rdsPer1000} × ${norms.correction.toFixed(1)}`}>
        <WhatToDo>
          Check how many newborns per 1,000 facility births are likely to need CPAP. RDS is respiratory distress syndrome, a
          breathing problem common in babies born early. The births counted are those in {sector} facilities, using each
          state’s own {shareTxt} of facility births from NFHS-6.
        </WhatToDo>
        <NumField field="rdsPer1000" label="RDS cases per 1,000 facility births" value={norms.rdsPer1000} preset={D.rdsPer1000} unit="per 1,000" step={1} min={1} max={60} dp={1}
          onChange={(v) => set({ rdsPer1000: v })}
          tip="The preset, 25, is the top of the range in Indian studies that count RDS per birth (4.5 to 25.3)."
          source={<SourceNote refs={[{ key: 'rdsRecent', page: '25.3' }, { key: 'rdsAIIMS', page: '19.1' }, { key: 'nnpd', page: '12.0' }, { key: 'rdsAFMC', page: '4.5' }]} />} />
        <NumField field="correction" label="Correction for other breathing problems" value={norms.correction} preset={D.correction} unit="×" step={0.1} min={1} max={4}
          onChange={(v) => set({ correction: v })}
          tip="RDS is not the only problem treated with CPAP. In Indian studies, the share of babies put on CPAP is about twice the share with RDS (1.9 in Aligarh, 2.1 in Navi Mumbai)."
          source={<SourceNote refs={[{ key: 'rdsRecent', page: '67.5% ÷ 35.5%' }, { key: 'distJain', page: '68% ÷ 32.8%' }]} />} />
        <SourceNote refs={[{ key: 'nfhs6', page: 'indicators 35 and 36' }]} note={`each state’s share of facility births in ${sector} facilities`} />
        <StepNav steps={steps} n={1} nextLabel="Next: from newborns to machines" />
      </StepCard>

      <StepCard steps={steps} n={2} title="From newborns to machines" note={`${norms.durationDays} days · ${pct(norms.buffer, 0)} buffer`}>
        <WhatToDo>Check how long each newborn stays on CPAP, how many reach a facility, and the planning buffer.</WhatToDo>
        <NumField field="durationDays" label="Days on CPAP per newborn" value={norms.durationDays} preset={D.durationDays} unit="days" step={0.5} min={0.5} max={15} dp={1}
          onChange={(v) => set({ durationDays: v })}
          tip="FBNC 2025 plans for 5 days. Indian studies saw shorter courses: about 1.0 day (Koti), 2.3 (Noolu) and 3.0 (Tahreem)."
          source={<SourceNote refs={[{ key: 'fbnc2025', page: 'CPAP therapy' }, { key: 'cpapKoti', page: '1.0' }, { key: 'cpapNoolu', page: '2.3' }, { key: 'cpapTahreem', page: '3.0' }]} />} />
        <NumField field="admissionRate" label="Share of these newborns who reach a facility" value={norms.admissionRate} preset={D.admissionRate} unit="%" scale={100} step={1} min={0} max={100} dp={0}
          onChange={(v) => set({ admissionRate: v })} hint="A programme assumption. The births counted already happen in facilities, so the preset is 100%." />
        <NumField field="buffer" label="Planning buffer" value={norms.buffer} preset={D.buffer} unit="%" scale={100} step={5} max={100} dp={0}
          onChange={(v) => set({ buffer: v })} hint="Extra machines for busy days, breakdowns and the time to order replacements." />
        <StepNav steps={steps} n={2} nextLabel="Next: sharing among states" />
      </StepCard>

      <StepCard steps={steps} n={3} title="Sharing the total among states" note={DRIVERS.find((d) => d.key === norms.driver)?.label}>
        <WhatToDo>Choose how the national number is shared among states. This does not change the national total, only each state’s share.</WhatToDo>
        <ChoiceField field="driver" label="Share by" options={DRIVERS} value={norms.driver} preset={D.driver} onChange={(driver) => set({ driver })}
          hint="States with more low birth weight babies and more newborn deaths get a larger share, because these point to greater need." />
        {norms.driver !== 'volume' && (
          <NumField field="beta" label="How strongly need changes the share" value={norms.beta} preset={D.beta} step={0.05} max={2}
            onChange={(v) => set({ beta: v })} hint="0 shares by births only. 1 gives a state with twice the need twice the rate per birth." />
        )}
        {norms.driver === 'composite' && (
          <div className="io-row2">
            <NumField field="wLbw" label="Weight on low birth weight" value={norms.wLbw} preset={D.wLbw} step={0.05} max={1} onChange={(v) => set({ wLbw: v })} />
            <NumField field="wNmr" label="Weight on newborn deaths" value={norms.wNmr} preset={D.wNmr} step={0.05} max={1} onChange={(v) => set({ wNmr: v })} />
          </div>
        )}
        <SourceNote refs={[{ key: 'nfhs5', page: 'LBW' }, { key: 'srs2024', page: 'Statement 48' }]} note="low birth weight and newborn death rate by state" />
        <DataCaveats />
        <StepNav steps={steps} n={3} />
      </StepCard>
    </>
  )

  const output = (
    <>
      <OutSection title="Result" step={`o-${scope}-result`} note={`${fmt(totals.gross)} machines`}>
        <Kpis items={[
          { label: 'CPAP machines needed', value: fmt(totals.gross), sub: `for newborns in ${sector} facilities, with the buffer`, main: true },
          { label: 'Facility births counted', value: fmt(totals.baseInstBirths), sub: `${sector} facility births a year` },
          { label: 'Newborns likely to need CPAP', value: fmt(totals.eligible), sub: `${totals.eligPer1000.toFixed(1)} per 1,000 births counted` },
        ]} />
        <Insight>
          About {fmt(totals.eligible)} newborns born in {sector} facilities each year are likely to need CPAP. On an
          average day about {fmt(totals.meanConcurrent)} of them are on CPAP, so with the buffer {fmt(totals.gross)} machines are needed.
          {top1 && <> {top1.state} needs the most: {fmt(top1.gross)}.</>}
        </Insight>
      </OutSection>

      <OutSection title="How the number is worked out" step={`o-${scope}-how`}>
        <Drill title={priv ? 'RDS-based need, private facilities' : 'RDS-based need'} controls={<GeoSelect value={geo} states={stateNames} onChange={setGeo} />}
          foot={!st ? <p className="io-drill-foot">The national number of newborns is worked out first, then shared among states. Pick a state above to see how its share is worked out.</p> : undefined}>
          <DrillBlock label="1 · Births counted" rows={[birthsRow]} />
          {st ? (
            <DrillBlock label="2 · The state’s share of the national number" rows={[
              { name: 'Need score', parts: scoreParts, value: st.index.toFixed(2) },
              { name: 'Share of India', parts: [`${fmt(st.baseInstBirths)} births × score ${st.index.toFixed(2)}`, ...(norms.driver !== 'volume' ? [' to the power ', pill(norms.beta.toFixed(2), 'beta')] : []), ', as a share of all states'], value: `${(st.share * 100).toFixed(2)}%` },
              { name: 'Newborns likely to need CPAP', parts: [`${fmt(totals.eligible)} for India × ${(st.share * 100).toFixed(2)}%`], value: fmt(st.eligible) },
            ]} />
          ) : (
            <DrillBlock label="2 · Newborns likely to need CPAP" rows={[
              { name: 'Newborns likely to need CPAP', parts: [`${fmt(totals.baseInstBirths)} × `, pill(`${norms.rdsPer1000} RDS per 1,000`, 'rdsPer1000'), ' ÷ 1,000 × ', pill(`${norms.correction.toFixed(1)}× for other problems`, 'correction')], value: fmt(totals.eligible) },
            ]} />
          )}
          <DrillBlock label="3 · From newborns to machines" rows={machineRows} />
        </Drill>
      </OutSection>

      <OutSection title="State by state" step={`o-${scope}-states`}>
        <M2Explorer rows={rows} totals={totals} />
      </OutSection>

      <OutSection title="Method and limits" step={`o-${scope}-limits`} defaultOpen={false}>
        <ul className="src-list io-list">
          <li>The national number is worked out first, then shared among states.</li>
          <li>Births are counted with each state’s own NFHS-6 {shareTxt} of facility births.</li>
          <li>The share uses two signals: low birth weight and the newborn death rate, each compared with the national level. Smaller states and union territories have no newborn death rate in SRS, so only low birth weight moves their share.</li>
          <li>The RDS rates come from studies in large referral hospitals, which see sicker babies. They are used only for the national number.</li>
          <li>There is no reliable state rate of premature birth, so low birth weight is used in its place.</li>
          {priv && <li>The private estimate is kept apart from the public estimates, because the government does not buy machines for private facilities.</li>}
        </ul>
      </OutSection>
    </>
  )

  return <IoPage scope={scope} inputs={inputs} output={output} />
}
