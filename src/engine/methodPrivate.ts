// Pure calculation engine for the PRIVATE-SECTOR CPAP estimate.
// Private maternity homes are counted by SIZE TIER (an absolute number of homes per
// tier), and each tier is equipped to a normative CPAP-per-facility level. A single
// "% conducting deliveries" factor scales all tiers. Independent of the public (NHM)
// cascades. No React.

export interface PrivateTier {
  name: string
  count: number // number of private maternity homes in this size tier
  cpap: number // CPAP devices per facility (normative for the tier; may be fractional)
}

export interface PrivateNorms {
  deliveryPct: number // % of homes conducting deliveries (scales every tier)
  tiers: PrivateTier[]
}

export const DEFAULT_PRIVATE: PrivateNorms = {
  deliveryPct: 100,
  tiers: [
    { name: 'High · 3+ bed SNCU', count: 2500, cpap: 3 },
    { name: 'Medium · 1–2 bed SNCU', count: 5000, cpap: 1.5 },
    { name: 'Small · basic setup', count: 30000, cpap: 0 },
  ],
}

export interface PrivateTierRow {
  name: string
  count: number // maternity homes in the tier
  facilities: number // homes × % conducting deliveries
  cpapPer: number
  devices: number
}

export interface PrivateComputed {
  homesTotal: number // total maternity homes across tiers
  delivering: number // total facilities conducting deliveries
  tiers: PrivateTierRow[]
  devices: number // total private-sector CPAP devices
}

export function computePrivate(n: PrivateNorms): PrivateComputed {
  const f = n.deliveryPct / 100
  let devices = 0
  let delivering = 0
  let homesTotal = 0
  const tiers = n.tiers.map((t) => {
    const facilities = Math.round(t.count * f)
    const dev = facilities * t.cpap
    devices += dev
    delivering += facilities
    homesTotal += t.count
    return { name: t.name, count: t.count, facilities, cpapPer: t.cpap, devices: dev }
  })
  return { homesTotal, delivering, tiers, devices }
}
