// Choropleth fill for a 0–1 value, blended from the active design's four map stops (CSS
// variables --map-0 … --map-3), so every map recolours when the design changes.
const STOPS = ['var(--map-0)', 'var(--map-1)', 'var(--map-2)', 'var(--map-3)']

export function mapColor(t: number): string {
  const c = Math.max(0, Math.min(1, t))
  const seg = c * (STOPS.length - 1)
  const i = Math.min(STOPS.length - 2, Math.floor(seg))
  return `color-mix(in srgb, ${STOPS[i + 1]} ${((seg - i) * 100).toFixed(1)}%, ${STOPS[i]})`
}
