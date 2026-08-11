import { useState } from 'react'
import type { Computed2, Totals2 } from '../engine/method2'
import { fmt } from '../utils/format'

type SortKey = 'state' | 'instBirths' | 'lbw' | 'nmr' | 'index' | 'eligible' | 'gross'

interface Col {
  key: SortKey
  label: string
  render: (r: Computed2) => string
  foot: (t: Totals2) => string
  cls?: string
}

const COLS: Col[] = [
  { key: 'state', label: 'State / UT', render: (r) => r.state, foot: () => 'India total' },
  { key: 'instBirths', label: 'Inst. births', render: (r) => fmt(r.instBirths), foot: (t) => fmt(t.instBirths) },
  { key: 'lbw', label: 'LBW %', render: (r) => (r.lbw != null ? r.lbw.toFixed(1) : 'NA'), foot: () => '' },
  { key: 'nmr', label: 'NMR', render: (r) => (r.nmr != null ? String(r.nmr) : 'NA'), foot: () => '' },
  { key: 'index', label: 'Risk index', render: (r) => r.index.toFixed(2), foot: () => '' },
  { key: 'eligible', label: 'Eligible cases', render: (r) => fmt(r.eligible), foot: (t) => fmt(t.eligible) },
  { key: 'gross', label: 'CPAP required', render: (r) => fmt(r.gross), foot: (t) => fmt(t.gross), cls: 'cell-strong' },
]

export default function M2Table({ rows, totals }: { rows: Computed2[]; totals: Totals2 }) {
  const [sortKey, setSortKey] = useState<SortKey>('gross')
  const [asc, setAsc] = useState(false)

  const sorted = [...rows].sort((a, b) => {
    let cmp: number
    if (sortKey === 'state') cmp = a.state.localeCompare(b.state)
    else {
      const av = a[sortKey] as number | null
      const bv = b[sortKey] as number | null
      cmp = (av ?? -Infinity) - (bv ?? -Infinity)
    }
    return asc ? cmp : -cmp
  })

  const onSort = (k: SortKey) => {
    if (k === sortKey) setAsc(!asc)
    else { setSortKey(k); setAsc(k === 'state') }
  }

  return (
    <div>
      <p className="card-note">
        Click a column to sort · 36 states / UTs. Risk index blends state LBW and NMR (relative to national); the
        national eligible-case pool is redistributed by institutional births × index^β. NMR is NA for smaller
        states/UTs (SRS does not report), and defaults to neutral in the index.
      </p>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>{COLS.map((c) => (
              <th key={c.key} className={sortKey === c.key ? 'sorted' : ''} onClick={() => onSort(c.key)} title="Sort">
                {c.label}{sortKey === c.key ? (asc ? ' ▲' : ' ▼') : ''}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.state}>{COLS.map((c) => <td key={c.key} className={c.cls ?? ''}>{c.render(r)}</td>)}</tr>
            ))}
          </tbody>
          <tfoot>
            <tr>{COLS.map((c) => <td key={c.key} className={c.cls ?? ''}>{c.foot(totals)}</td>)}</tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
