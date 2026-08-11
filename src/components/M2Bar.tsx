import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { Computed2 } from '../engine/method2'
import type { Metric2 } from '../engine/metrics2'
import { fmtMetric } from '../engine/metrics2'

const TEAL = '#0e7e92'
const AxisTick = { fontSize: 11, fill: '#52616d', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }

export default function M2Bar({ rows, metric }: { rows: Computed2[]; metric: Metric2 }) {
  const top = [...rows]
    .filter((r) => isFinite(metric.get(r)))
    .sort((a, b) => metric.get(b) - metric.get(a))
    .slice(0, 15)
    .map((r) => ({ state: r.state, v: metric.get(r) }))

  const Tip = ({ active, payload, label }: any) =>
    active && payload?.length ? (
      <div className="chart-tip">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ color: TEAL }}>{metric.label}: <strong>{fmtMetric(metric.kind, payload[0].value)}</strong></div>
      </div>
    ) : null

  return (
    <div>
      <p className="card-note">Top 15 states by {metric.label.toLowerCase()}.</p>
      <div className="chart-box" style={{ height: 470 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 8 }}>
            <CartesianGrid horizontal={false} stroke="#e4ebef" />
            <XAxis type="number" tick={AxisTick} tickFormatter={(v) => fmtMetric(metric.kind, v)} />
            <YAxis type="category" dataKey="state" width={120} tick={AxisTick} interval={0} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(14,126,146,0.07)' }} />
            <Bar dataKey="v" name={metric.label} fill={TEAL} radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
