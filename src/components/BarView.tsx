import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { ComputedRow } from '../engine/method1'
import { fmt } from '../utils/format'

const ASIS = '#0e7e92'
const INST = '#2e8b57'
const GAP_GI = '#c99700'

export interface Series {
  asis: boolean
  installed: boolean
  gapGI: boolean
}

interface Props {
  rows: ComputedRow[]
  series: Series
}

const AxisTick = { fontSize: 11, fill: '#52616d', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }

export const SERIES_META: { flag: keyof Series; dataKey: string; name: string; btn: string; color: string }[] = [
  { flag: 'asis', dataKey: 'asisCpap', name: 'Current infra-based', btn: 'Current infra-based', color: ASIS },
  { flag: 'installed', dataKey: 'installed', name: 'Installed (actual)', btn: 'Installed', color: INST },
  { flag: 'gapGI', dataKey: 'gapGuidInstalled', name: 'Gap · infra−inst', btn: 'Gap infra−inst', color: GAP_GI },
]

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
  // Leading series drives the top-15 ranking; installed-based series sort missing states last.
  const active = SERIES_META.filter((s) => series[s.flag])
  const lead = active[0] ?? SERIES_META[0]
  const leadVal = (r: ComputedRow) => {
    const v = (r as any)[lead.dataKey] as number | undefined
    return v == null ? Number.NEGATIVE_INFINITY : v
  }
  const top = [...rows].sort((a, b) => leadVal(b) - leadVal(a)).slice(0, 15)
  const installedSelected = series.installed || series.gapGI

  return (
    <div>
      <p className="card-note">
        Top 15 states by the leading series — compare current infra-based, actual-installed, and the gap between them
        (current-infra − installed).{installedSelected && ' Installed series/gap show only for the states with a reported device count.'}
      </p>
      <div className="chart-box" style={{ height: 470 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barGap={1}>
            <CartesianGrid horizontal={false} stroke="#e4ebef" />
            <XAxis type="number" tick={AxisTick} tickFormatter={(v) => fmt(v)} />
            <YAxis type="category" dataKey="state" width={120} tick={AxisTick} interval={0} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(14,126,146,0.07)' }} />
            {active.map((s) => (
              <Bar key={s.flag} dataKey={s.dataKey} name={s.name} fill={s.color} radius={[0, 2, 2, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="legend-row">
        {active.map((s) => (
          <span key={s.flag}><span className="legend-dot" style={{ background: s.color }} />{s.name}</span>
        ))}
      </div>
    </div>
  )
}
