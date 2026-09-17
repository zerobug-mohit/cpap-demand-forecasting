import { useState } from 'react'
import type { ComputedRow, Totals } from '../engine/method1'
import { fmt } from '../utils/format'

interface Props {
  rows: ComputedRow[]
  totals: Totals
  showExt: boolean
}

type SortKey = 'state' | 'sncu' | 'asisBeds' | 'asisCpap' | 'births' | 'extraCpap' | 'installed' | 'gapGuidInstalled'

interface Col {
  key: SortKey
  label: string
  render: (r: ComputedRow) => string
  foot: (t: Totals) => string
  cls?: string
}

const BASE_COLS: Col[] = [
  { key: 'state', label: 'State / UT', render: (r) => r.state, foot: () => 'India total' },
  { key: 'sncu', label: 'SNCUs', render: (r) => fmt(r.sncu), foot: (t) => fmt(t.sncu) },
  { key: 'asisBeds', label: 'SNCU beds', render: (r) => fmt(r.asisBeds), foot: (t) => fmt(t.asisBeds) },
  { key: 'asisCpap', label: 'CPAP · current-infra', render: (r) => fmt(r.asisCpap), foot: (t) => fmt(t.asisCpap), cls: 'cell-strong' },
  { key: 'births', label: 'Live births', render: (r) => fmt(r.births), foot: (t) => fmt(t.births) },
]

const EXT_COL: Col = {
  key: 'extraCpap',
  label: 'Add-on',
  render: (r) => fmt(r.extraCpap),
  foot: (t) => fmt(t.extraCpap),
  cls: 'cell-ext',
}

const INSTALLED_COL: Col = {
  key: 'installed',
  label: 'Installed · actual',
  render: (r) => (r.installed != null ? fmt(r.installed) : '—'),
  foot: () => '—',
  cls: 'cell-strong',
}

const GAP2_COL: Col = {
  key: 'gapGuidInstalled',
  label: 'Gap · infra−inst',
  render: (r) => (r.gapGuidInstalled != null ? fmt(r.gapGuidInstalled) : '—'),
  foot: () => '—',
  cls: 'cell-gap',
}

export default function StateTable({ rows, totals, showExt }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('asisCpap')
  const [asc, setAsc] = useState(false)

  const cols = [...BASE_COLS, ...(showExt ? [EXT_COL] : []), INSTALLED_COL, GAP2_COL]

  const val = (r: ComputedRow) => {
    if (sortKey === 'installed') return r.installed ?? Number.NEGATIVE_INFINITY
    if (sortKey === 'gapGuidInstalled') return r.gapGuidInstalled ?? Number.NEGATIVE_INFINITY
    return r[sortKey] as number
  }
  const sorted = [...rows].sort((a, b) => {
    const cmp = sortKey === 'state' ? a.state.localeCompare(b.state) : val(a) - val(b)
    return asc ? cmp : -cmp
  })

  const onSort = (k: SortKey) => {
    if (k === sortKey) setAsc(!asc)
    else {
      setSortKey(k)
      setAsc(k === 'state')
    }
  }

  return (
    <div>
      <p className="card-note">
        Click a column to sort · 36 states / UTs. The current infra-based lens applies the FBNC norm to today's SNCU beds
        (units × avg beds).
        {showExt ? ' Add-on shows the NBSU/Transport extension, already included in the CPAP column.' : ''}{' '}
        <strong>Gap · infra−inst</strong> = current infra-based − installed (positive = installed falls short).{' '}
        <strong>Installed · actual</strong> = reported CPAP devices, available so far for MP (282), Bihar (70),
        Punjab (59), Rajasthan (961) and Chhattisgarh (58); “—” where not yet reported (so the gap and national total are blank).
      </p>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={sortKey === c.key ? 'sorted' : ''} onClick={() => onSort(c.key)} title="Sort">
                  {c.label}
                  {sortKey === c.key ? (asc ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.state}>
                {cols.map((c) => (
                  <td key={c.key} className={c.cls ?? ''}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              {cols.map((c) => (
                <td key={c.key} className={c.cls ?? ''}>
                  {c.foot(totals)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
