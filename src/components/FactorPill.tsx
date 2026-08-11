import type { ReactNode } from 'react'
import { requestFactorFocus, scrollToFactor } from '../utils/factorFocus'

/** A yellow pill for a user-configurable factor. Clicking opens the containing panel
 *  section (if collapsed) and scrolls the matching input into view, highlighting it. */
export default function FactorPill({ target, children }: { target: string; children: ReactNode }) {
  const go = () => {
    if (scrollToFactor(target)) return // already visible
    requestFactorFocus(target) // ask its section to open
    window.setTimeout(() => scrollToFactor(target), 90) // then scroll once it has mounted
  }
  return (
    <button type="button" className="factor-pill" onClick={go} title="Adjust this on the left">
      {children}
    </button>
  )
}
