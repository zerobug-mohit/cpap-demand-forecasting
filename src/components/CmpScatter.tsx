import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import type { BuLens, CmpRow } from '../engine/compare'
import { classify, CLS_LABEL, CLS_COLOR } from '../engine/compare'
import { fmt } from '../utils/format'
import { ExplainHere } from './Explain'

const AxisTick = { fontSize: 11, fill: 'var(--chart-axis)', fontFamily: 'var(--font-data)' }

export default function CmpScatter({ rows, lens }: { rows: CmpRow[]; lens: BuLens }) {
  const buOf = (r: CmpRow) => (lens === 'existing' ? r.buExisting : r.buNormative)
  const pts = rows
    .filter((r) => r.td > 0 && buOf(r) > 0)
    .map((r) => ({ state: r.state, x: r.td, y: buOf(r), z: r.births, cls: classify(buOf(r), r.td) }))
  const excluded = rows.length - pts.length

  const vals = pts.flatMap((p) => [p.x, p.y])
  const lo = Math.max(1, Math.floor(Math.min(...vals)))
  const hi = Math.ceil(Math.max(...vals))

  // Best-fit on log10(x), log10(y) → a power law y = C·x^b (a straight line on log-log axes).
  const FIT = 'var(--s-fit)'
  const lx = pts.map((p) => Math.log10(p.x))
  const ly = pts.map((p) => Math.log10(p.y))
  const n = pts.length
  const mx = lx.reduce((a, b) => a + b, 0) / (n || 1)
  const my = ly.reduce((a, b) => a + b, 0) / (n || 1)
  let sxx = 0, sxy = 0, syy = 0
  for (let i = 0; i < n; i++) { const dx = lx[i] - mx, dy = ly[i] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy }
  const hasFit = n >= 3 && sxx > 0 && syy > 0
  const b = hasFit ? sxy / sxx : 0
  const a = hasFit ? my - b * mx : 0
  const r2 = hasFit ? (sxy * sxy) / (sxx * syy) : 0
  const C = Math.pow(10, a)
  const fitAt = (x: number) => Math.pow(10, a + b * Math.log10(x))
  const eqn = `y = ${C < 100 ? C.toFixed(2) : fmt(Math.round(C))} · x^${b.toFixed(2)}`

  const Tip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const ratio = d.y / d.x
    return (
      <div className="chart-tip">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.state}</div>
        <div>Epidemiological need: <strong>{fmt(d.x)}</strong></div>
        <div>Guidelines-based current demand: <strong>{fmt(d.y)}</strong></div>
        <div>Ratio (current ÷ need): <strong>{ratio.toFixed(2)}×</strong></div>
        <div style={{ color: CLS_COLOR[d.cls as keyof typeof CLS_COLOR], fontWeight: 700 }}>{CLS_LABEL[d.cls as keyof typeof CLS_LABEL]}</div>
      </div>
    )
  }

  return (
    <div>
      <ExplainHere id="cmp-scatter" />
      <p className="card-note">
        Each dot is a state. The bottom axis shows the epidemiological need and the side axis shows the guidelines-based
        current demand. On both axes the numbers grow by multiples, not by equal steps. A larger dot means the state has
        more births. The grey dashed line marks where the two are equal. Dots <strong>below</strong> it are states where
        current demand is lower than the need, and dots <strong>above</strong> it are states where it is higher.
        {hasFit && (
          <> The <span style={{ color: FIT, fontWeight: 700 }}>coloured line</span> is the trend line through the
          dots (<strong>{eqn}</strong>, R² = {r2.toFixed(2)}).{' '}
          {b < 1 ? 'It is flatter than the grey line, so current demand rises more slowly than need, and larger states have less of their need covered.' : b > 1 ? 'It is steeper than the grey line, so current demand rises faster than need.' : 'It runs about parallel to the grey line, so current demand rises in step with need.'}</>
        )}
        {excluded > 0 && ` ${excluded} state(s) with a zero value are left out.`}
      </p>
      <div className="chart-box" style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 24, bottom: 28, left: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis type="number" dataKey="x" name="Epidemiological need" scale="log" domain={[lo, hi]} allowDataOverflow
              tick={AxisTick} tickFormatter={(v) => fmt(v)}
              label={{ value: 'Epidemiological need', position: 'insideBottom', offset: -14, fontSize: 12, fill: 'var(--chart-axis)' }} />
            <YAxis type="number" dataKey="y" name="Guidelines-based" scale="log" domain={[lo, hi]} allowDataOverflow
              tick={AxisTick} tickFormatter={(v) => fmt(v)} width={54}
              label={{ value: 'Guidelines-based current demand', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'var(--chart-axis)' }} />
            <ZAxis type="number" dataKey="z" range={[30, 380]} />
            <ReferenceLine segment={[{ x: lo, y: lo }, { x: hi, y: hi }]} stroke="var(--s-parity)" strokeDasharray="5 4" ifOverflow="extendDomain" />
            {hasFit && (
              <ReferenceLine segment={[{ x: lo, y: fitAt(lo) }, { x: hi, y: fitAt(hi) }]} stroke={FIT} strokeWidth={2} ifOverflow="extendDomain" />
            )}
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
        <span><span className="legend-dot" style={{ background: 'var(--s-parity)' }} />Current demand = need</span>
        {hasFit && <span><span className="legend-dot" style={{ background: FIT }} />Trend line · {eqn} · R² {r2.toFixed(2)}</span>}
      </div>
    </div>
  )
}
