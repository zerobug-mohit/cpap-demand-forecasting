import { SOURCES } from '../data/sources'
import type { SourceKey } from '../data/sources'

export interface SourceRef {
  key: SourceKey
  page?: string
}

interface Props {
  refs: SourceRef[]
  prefix?: string
  note?: string
}

export default function SourceNote({ refs, prefix = 'Source', note }: Props) {
  return (
    <div className="source-note">
      <span className="src-prefix">{prefix}:</span>{' '}
      {note && <span>{note} — </span>}
      {refs.map((r, i) => {
        const s = SOURCES[r.key]
        return (
          <span key={`${r.key}-${i}`}>
            {i > 0 && <span className="src-sep"> · </span>}
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
              {r.page ? ` (${r.page})` : ''}
              <span className="src-ext" aria-hidden> ↗</span>
            </a>
          </span>
        )
      })}
    </div>
  )
}
