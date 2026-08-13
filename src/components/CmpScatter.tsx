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

  // Best-fit on log10(x), log10(y) → a power law y = C·x^b (a straight line on log-log axes).
  const FIT = '#8338ec'
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
        births. The grey dashed line is parity (y = x) — points <strong>below</strong> it are states where the {lensLabel}
        network trails clinical need; <strong>above</strong>, it exceeds need.
        {hasFit && (
          <> The <span style={{ color: FIT, fontWeight: 700 }}>solid line</span> is the least-squares best fit on the
          log–log data (a power law): <strong>{eqn}</strong>, <strong>R² = {r2.toFixed(2)}</strong> (n = {n}). A slope
          b {b < 1 ? '< 1 means infrastructure grows slower than need (larger states relatively under-covered)' : b > 1 ? '> 1 means infrastructure grows faster than need' : '≈ 1 means infrastructure scales proportionally with need'}.</>
        )}
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
        <span><span className="legend-dot" style={{ background: '#86909a' }} />Parity (y = x)</span>
        {hasFit && <span><span className="legend-dot" style={{ background: FIT }} />Best fit · {eqn} · R² {r2.toFixed(2)}</span>}
      </div>
    </div>
  )
}
