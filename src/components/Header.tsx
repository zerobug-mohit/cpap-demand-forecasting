import { useState } from 'react'
import { DESIGNS, applyDesign, initialDesign } from '../design/designs'

// Lets the viewer flip the whole tool between the design variations being compared.
function DesignSwitcher() {
  const [design, setDesign] = useState(initialDesign)
  const current = DESIGNS.find((d) => d.key === design) ?? DESIGNS[0]
  return (
    <div className="design-switch">
      <label htmlFor="design-select">Design</label>
      <select id="design-select" value={design} onChange={(e) => { setDesign(e.target.value); applyDesign(e.target.value) }}>
        {DESIGNS.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
      </select>
      <p className="design-note">{current.note}</p>
    </div>
  )
}

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <h1>CPAP Demand Estimation &amp; Forecasting</h1>
        </div>
        <DesignSwitcher />
      </div>
    </header>
  )
}
