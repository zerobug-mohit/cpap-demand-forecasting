// Cross-component "jump to this input" mechanism used by the flow-diagram factor pills.
// A pill requests focus by id; any collapsed PanelSection containing that id opens itself,
// then the target is scrolled into view and briefly highlighted.

export function requestFactorFocus(id: string) {
  window.dispatchEvent(new CustomEvent('factorfocus', { detail: id }))
}

export function scrollToFactor(id: string) {
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('factor-flash')
  void el.offsetWidth // reflow so the animation retriggers on repeat clicks
  el.classList.add('factor-flash')
  window.setTimeout(() => el.classList.remove('factor-flash'), 1300)
  return true
}
