const INR = new Intl.NumberFormat('en-IN') // built once — constructing a formatter per call is slow on busy pages

export const fmt = (n: number): string => INR.format(Math.round(n))

export const fmtPct = (n: number, digits = 0): string => `${(n * 100).toFixed(digits)}%`

export const fmtCompact = (n: number): string => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n)}`
}
