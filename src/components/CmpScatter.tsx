import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import type { BuLens, CmpRow } from '../engine/compare'
import { classify, CLS_LABEL, CLS_COLOR } from '../engine/compare'
import { fmt } from '../utils/format'

const AxisTick = { fontSize: 11, fill: '#52616d', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }

export default function CmpScatter({ rows, lens }: { rows: CmpRow[]; lens: BuLens }) {
  const buOf = (r: CmpRow) => (lens === 'existing' ? r.buExisting : r.buNormative)
  const lensLabel = lens === 'existing' ? 'guidelines-based' : 'normative'
  const pts = rows
    .filter((r) => r.td > 0 && buOf(r) > 0)
    .map((r) => ({ state: r.state, x: r.td, y: buOf(r), z: r.births, cls: classify(buOf(r), r.td) }))
  const excluded = rows.length - pts.length

  const vals = pts.flatMap((p) => [p.x, p.y])
  const lo = Math.max(1, Math.floor(Math.min(...vals)))
  const hi = Math.ceil(Math.max(...vals))

  const Tip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const ratio = d.y / d.x
    return (
      <div className="chart-tip">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.state}</div>
        <div>Clinical need: <strong>{fmt(d.x)}</strong></div>
        <div>Infrastructure ({lensLabel}): <strong>{fmt(d.y)}</strong></div>
        <div>Ratio ({lensLabel} ÷ clinical): <strong>{ratio.toFixed(2)}×</strong></div>
        <div style={{ color: CLS_COLOR[d.cls as keyof typeof CLS_COLOR], fontWeight: 700 }}>{CLS_LABEL[d.cls as keyof typeof CLS_LABEL]}</div>
      </div>
    )
  }

  return (
    <div>
      <p className="card-note">
        Each point is a state: epidemiological clinical need (x) vs infrastructure {lensLabel} requirement (y), log–log, sized by
        births. The dashed line is parity (y = x). Points <strong>below</strong> it are states where the {lensLabel}
        network trails clinical need; <strong>above</strong>, it exceeds need.
        {excluded > 0 && ` ${excluded} state(s) with a zero value are omitted.`}
      </p>
      <div className="chart-box" style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 24, bottom: 28, left: 8 }}>
            <CartesianGrid stroke="#e4ebef" />
            <XAxis type="number" dataKey="x" name="Clinical need" scale="log" domain={[lo, hi]} allowDataOverflow
              tick={AxisTick} tickFormatter={(v) => fmt(v)}
              label={{ value: 'Epidemiological — clinical need', position: 'insideBottom', offset: -14, fontSize: 12, fill: '#52616d' }} />
            <YAxis type="number" dataKey="y" name="Infrastructure" scale="log" domain={[lo, hi]} allowDataOverflow
              tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54}
              label={{ value: `Infrastructure — ${lensLabel}`, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#52616d' }} />
            <ZAxis type="number" dataKey="z" range={[30, 380]} />
            <ReferenceLine segment={[{ x: lo, y: lo }, { x: hi, y: hi }]} stroke="#86909a" strokeDasharray="5 4" ifOverflow="extendDomain" />
            <Tooltip content={<Tip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={pts} fillOpacity={0.72}>
              {pts.map((p) => <Cell key={p.state} fill={CLS_COLOR[p.cls]} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="legend-row">
        {(['under', 'aligned', 'over'] as const).map((c) => (
          <span key={c}><span className="legend-dot" style={{ background: CLS_COLOR[c] }} />{CLS_LABEL[c]}</span>
        ))}
      </div>
    </div>
  )
}
