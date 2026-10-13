// The design variations the masthead switcher offers. Each one is a complete visual language,
// styled in src/styles/designs.css and keyed by `data-design` on <html>. "Original" has no key.

export interface Design {
  key: string
  name: string
  note: string // one plain sentence shown under the switcher
  fonts?: string // Google Fonts css2 family query, loaded only when the design is chosen
}

export const DESIGNS: Design[] = [
  { key: 'original', name: 'Original', note: 'This is the current look, kept for comparison.' },
  {
    key: 'report', name: 'Report', note: 'This looks like a printed report, with open pages, teal section bands and book-style text.',
    fonts: 'family=Libre+Franklin:wght@400;500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400',
  },
  {
    key: 'bulletin', name: 'Bulletin', note: 'This looks like a government statistics bulletin, with lined tables, book-style titles and navy text.',
    fonts: 'family=Noto+Serif:wght@600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Mono:wght@400;500',
  },
  {
    key: 'civic', name: 'Public service', note: 'This looks like a government service website, with large clear text, plain borders and a strong outline on the selected item.',
    fonts: 'family=Public+Sans:wght@400;500;600;700;800',
  },
  {
    key: 'blueprint', name: 'Blueprint', note: 'This looks like a technical plan, with a navy background, a faint grid and narrow lettering.',
    fonts: 'family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700',
  },
  {
    key: 'swiss', name: 'Swiss grid', note: 'This uses a Swiss poster style, with black lines, large numbers and one yellow highlight.',
    fonts: 'family=Schibsted+Grotesk:wght@400;500;600;700;800',
  },
  {
    key: 'swiss-chai', name: 'Swiss grid, CHAI colours', note: 'This is the Swiss grid in CHAI navy and teal, with a saffron highlight on what is selected.',
    fonts: 'family=Schibsted+Grotesk:wght@400;500;600;700;800',
  },
  {
    key: 'monitor', name: 'Ward monitor', note: 'This looks like the central monitor in a newborn unit, with a dark screen, large number displays and signal colours.',
    fonts: 'family=B612:wght@400;700&family=B612+Mono:wght@400;700',
  },
]

const STORE = 'cpap-design'

/** The design to start with: ?design=… in the address, then the last one chosen, then Original. */
export function initialDesign(): string {
  const valid = (k: string | null) => (k && DESIGNS.some((d) => d.key === k) ? k : null)
  const fromUrl = valid(new URLSearchParams(window.location.search).get('design'))
  if (fromUrl) return fromUrl
  try {
    return valid(window.localStorage.getItem(STORE)) ?? 'original'
  } catch {
    return 'original'
  }
}

/** Switch the page to a design: set the root attribute, load its fonts once, remember the choice. */
export function applyDesign(key: string) {
  const d = DESIGNS.find((x) => x.key === key) ?? DESIGNS[0]
  const root = document.documentElement
  if (d.key === 'original') delete root.dataset.design
  else root.dataset.design = d.key
  if (d.fonts && !document.getElementById(`font-${d.key}`)) {
    const link = document.createElement('link')
    link.id = `font-${d.key}`
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${d.fonts}&display=swap`
    document.head.appendChild(link)
  }
  try {
    window.localStorage.setItem(STORE, d.key)
  } catch {
    // storage blocked (private window): the choice just isn't remembered
  }
  const url = new URL(window.location.href)
  if (d.key === 'original') url.searchParams.delete('design')
  else url.searchParams.set('design', d.key)
  window.history.replaceState(null, '', url)
}
