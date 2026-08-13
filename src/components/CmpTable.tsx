import { useState } from 'react'
import type { CmpRow } from '../engine/compare'
import { classify, CLS_LABEL, CLS_COLOR } from '../engine/compare'
import { fmt } from '../utils/format'

type SortKey = 'state' | 'td' | 'buExisting' | 'buNormative' | 'installed' | 'coverage' | 'unmet'

const coverage = (r: CmpRow) => (r.td > 0 ? r.buExisting / r.td : 0)
const unmet = (r: CmpRow) => Math.max(0, r.td - r.buExisting)

export default function CmpTable({ rows }: { rows: CmpRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('unmet')
  const [asc, setAsc] = useState(false)

  const val = (r: CmpRow, k: SortKey): number =>
    k === 'coverage' ? coverage(r) : k === 'unmet' ? unmet(r) : k === 'installed' ? (r.installed ?? -1) : (r[k as 'td' | 'buExisting' | 'buNormative'] as number)

  const sorted = [...rows].sort((a, b) => {
    const cmp = sortKey === 'state' ? a.state.localeCompare(b.state) : val(a, sortKey) - val(b, sortKey)
    return asc ? cmp : -cmp
  })
  const onSort = (k: SortKey) => { if (k === sortKey) setAsc(!asc); else { setSortKey(k); setAsc(k === 'state') } }

  const tot = rows.reduce((a, r) => ({ td: a.td + r.td, e: a.e + r.buExisting, n: a.n + r.buNormative }), { td: 0, e: 0, n: 0 })

  const cols: { key: SortKey; label: string }[] = [
    { key: 'state', label: 'State / UT' },
    { key: 'td', label: 'Clinical need' },
    { key: 'buExisting', label: 'Guidelines-based' },
    { key: 'buNormative', label: 'Normative' },
    { key: 'installed', label: 'Installed · actual' },
    { key: 'coverage', label: 'Coverage (guidelines/need)' },
    { key: 'unmet', label: 'Unmet need' },
  ]

  return (
    <div>
      <p className="card-note">
        Click a column to sort · 36 states / UTs. Coverage = guidelines-based ÷ clinical need; unmet =
        clinical need − guidelines-based. Status classifies guidelines-based vs need.
      </p>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={sortKey === c.key ? 'sorted' : ''} onClick={() => onSort(c.key)} title="Sort">
                  {c.label}{sortKey === c.key ? (asc ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const cls = classify(r.buExisting, r.td)
              return (
                <tr key={r.state}>
                  <td>{r.state}</td>
                  <td>{fmt(r.td)}</td>
                  <td>{fmt(r.buExisting)}</td>
                  <td>{fmt(r.buNormative)}</td>
                  <td className="cell-strong">{r.installed != null ? fmt(r.installed) : '—'}</td>
                  <td>{r.td > 0 ? `${Math.round(coverage(r) * 100)}%` : 'NA'}</td>
                  <td className="cell-gap">{fmt(unmet(r))}</td>
                  <td style={{ color: CLS_COLOR[cls], fontWeight: 700, textAlign: 'left' }}>{CLS_LABEL[cls]}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>India total</td>
              <td>{fmt(tot.td)}</td>
              <td>{fmt(tot.e)}</td>
              <td>{fmt(tot.n)}</td>
              <td>—</td>
              <td>{tot.td > 0 ? `${Math.round((tot.e / tot.td) * 100)}%` : 'NA'}</td>
              <td className="cell-gap">{fmt(Math.max(0, tot.td - tot.e))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
