import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { ComputedRow } from '../engine/method1'
import { fmt } from '../utils/format'

const ASIS = '#0e7e92'
const NORM = '#123a5e'
const GAP = '#c2562b'

export interface Series {
  asis: boolean
  norm: boolean
  gap: boolean
}

interface Props {
  rows: ComputedRow[]
  series: Series
}

const AxisTick = { fontSize: 11, fill: '#52616d', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export default function BarView({ rows, series }: Props) {
  const sortKey = series.norm ? 'normCpap' : series.asis ? 'asisCpap' : 'cpapGap'
  const top = [...rows].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number)).slice(0, 15)

  return (
    <div>
      <p className="card-note">
        Top 15 states by the leading series. Compare the guidelines-based estimation against the full build-out
        (normative) and, optionally, the gap between them.
      </p>
      <div className="chart-box" style={{ height: 470 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barGap={1}>
            <CartesianGrid horizontal={false} stroke="#e4ebef" />
            <XAxis type="number" tick={AxisTick} tickFormatter={(v) => fmt(v)} />
            <YAxis type="category" dataKey="state" width={120} tick={AxisTick} interval={0} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(14,126,146,0.07)' }} />
            {series.asis && <Bar dataKey="asisCpap" name="Guidelines-based" fill={ASIS} radius={[0, 2, 2, 0]} />}
            {series.norm && <Bar dataKey="normCpap" name="Normative" fill={NORM} radius={[0, 2, 2, 0]} />}
            {series.gap && <Bar dataKey="cpapGap" name="Gap" fill={GAP} radius={[0, 2, 2, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="legend-row">
        {series.asis && <span><span className="legend-dot" style={{ background: ASIS }} />Guidelines-based</span>}
        {series.norm && <span><span className="legend-dot" style={{ background: NORM }} />Normative</span>}
        {series.gap && <span><span className="legend-dot" style={{ background: GAP }} />Gap</span>}
      </div>
    </div>
  )
}
