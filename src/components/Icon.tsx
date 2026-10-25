// Small line icons drawn in one consistent stroke, so every design gets the same icon family.
// They inherit the text colour (currentColor) and size from the font size.

const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

export function BulbIcon() {
  return (
    <svg {...base}>
      <path d="M9 18h6" />
      <path d="M10 21.5h4" />
      <path d="M15.1 14.5c.2-1 .7-1.8 1.5-2.6A5.4 5.4 0 0 0 18 8.2a6 6 0 0 0-12 0c0 1.1.3 2.4 1.5 3.7.7.8 1.2 1.6 1.4 2.6" />
    </svg>
  )
}

export function ResetIcon() {
  return (
    <svg {...base}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3.5 3.5V8H8" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg {...base} strokeWidth={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

/** A path with a start and an end point: the guided tour. */
export function TourIcon() {
  return (
    <svg {...base}>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg {...base}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}
