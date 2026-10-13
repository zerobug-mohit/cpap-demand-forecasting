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
  { key: 'asisCpap', label: 'CPAP, current demand', render: (r) => fmt(r.asisCpap), foot: (t) => fmt(t.asisCpap), cls: 'cell-strong' },
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
  label: 'Installed (actual)',
  render: (r) => (r.installed != null ? fmt(r.installed) : '–'),
  foot: () => '–',
  cls: 'cell-strong',
}

const GAP2_COL: Col = {
  key: 'gapGuidInstalled',
  label: 'Gap: current minus installed',
  render: (r) => (r.gapGuidInstalled != null ? fmt(r.gapGuidInstalled) : '–'),
  foot: () => '–',
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
        Click a column heading to sort the table. The table covers all 36 states and union territories. The current
        demand figure applies the FBNC norm to today's SNCU beds (the number of SNCUs times the average beds in each)
        and adds the planning buffer.
        {showExt ? ' The "Add-on" column shows the devices from the NBSU and transport add-on. They are already included in the current demand column.' : ''}{' '}
        <strong>Gap: current minus installed</strong> is the current demand estimate minus the devices actually
        installed. A positive number means fewer devices are installed than the estimate.{' '}
        <strong>Installed (actual)</strong> is the number of CPAP devices that states have reported. So far we have
        this for Uttar Pradesh (211), Madhya Pradesh (282), Bihar (72), Punjab (59), Rajasthan (961) and Chhattisgarh
        (58). Where no count has been reported, the table shows “–” for the installed figure and the gap. The national
        total is also left blank for these two columns.
      </p>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={sortKey === c.key ? 'sorted' : ''} onClick={() => onSort(c.key)} title="Click to sort">
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
