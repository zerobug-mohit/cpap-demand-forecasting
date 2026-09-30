import { useState } from 'react'
import type { CmpRow } from '../engine/compare'
import { fmt } from '../utils/format'

type SortKey = 'state' | 'td' | 'buExisting' | 'installed' | 'coverage' | 'unmetAct' | 'unmetGuid'

const coverage = (r: CmpRow) => (r.td > 0 ? r.buExisting / r.td : 0)
const unmetGuid = (r: CmpRow) => Math.max(0, r.td - r.buExisting) // need − current demand
const unmetAct = (r: CmpRow): number | null => (r.installed != null ? Math.max(0, r.td - r.installed) : null) // need − installed

export default function CmpTable({ rows }: { rows: CmpRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('unmetGuid')
  const [asc, setAsc] = useState(false)

  const val = (r: CmpRow, k: SortKey): number =>
    k === 'coverage' ? coverage(r)
      : k === 'unmetGuid' ? unmetGuid(r)
        : k === 'unmetAct' ? (unmetAct(r) ?? Number.NEGATIVE_INFINITY)
          : k === 'installed' ? (r.installed ?? Number.NEGATIVE_INFINITY)
            : (r[k as 'td' | 'buExisting'] as number)

  const sorted = [...rows].sort((a, b) => {
    const cmp = sortKey === 'state' ? a.state.localeCompare(b.state) : val(a, sortKey) - val(b, sortKey)
    return asc ? cmp : -cmp
  })
  const onSort = (k: SortKey) => { if (k === sortKey) setAsc(!asc); else { setSortKey(k); setAsc(k === 'state') } }

  const tot = rows.reduce((a, r) => ({ td: a.td + r.td, e: a.e + r.buExisting }), { td: 0, e: 0 })

  const cols: { key: SortKey; label: string }[] = [
    { key: 'state', label: 'State / UT' },
    { key: 'td', label: 'Epidemiological need' },
    { key: 'buExisting', label: 'Current infra-based' },
    { key: 'installed', label: 'Installed · actual' },
    { key: 'coverage', label: 'Coverage (infra/need)' },
    { key: 'unmetAct', label: 'Unmet vs installed' },
    { key: 'unmetGuid', label: 'Unmet vs current demand' },
  ]

  return (
    <div>
      <p className="card-note">
        Click a column to sort · 36 states / UTs. <strong>Unmet vs installed</strong> = epidemiological need −
        installed actual, shown only for states that report a device count. <strong>Unmet vs current demand</strong>{' '}
        = epidemiological need − guidelines-based current demand (the build-out gap). Coverage = current infra-based ÷
        epidemiological need.
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
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const ua = unmetAct(r)
              return (
                <tr key={r.state}>
                  <td>{r.state}</td>
                  <td>{fmt(r.td)}</td>
                  <td>{fmt(r.buExisting)}</td>
                  <td className="cell-strong">{r.installed != null ? fmt(r.installed) : '—'}</td>
                  <td>{r.td > 0 ? `${Math.round(coverage(r) * 100)}%` : 'NA'}</td>
                  <td className="cell-gap">{ua != null ? fmt(ua) : '—'}</td>
                  <td className="cell-gap">{fmt(unmetGuid(r))}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>India total</td>
              <td>{fmt(tot.td)}</td>
              <td>{fmt(tot.e)}</td>
              <td>—</td>
              <td>{tot.td > 0 ? `${Math.round((tot.e / tot.td) * 100)}%` : 'NA'}</td>
              <td className="cell-gap">—</td>
              <td className="cell-gap">{fmt(Math.max(0, tot.td - tot.e))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
