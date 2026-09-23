// Pure calculation engine for the PRIVATE-SECTOR CPAP estimate.
// Private maternity homes / nursing homes are sized separately from the public
// facility network: a base count of delivering private facilities is split by
// facility size, and each size tier is equipped to a normative CPAP-per-facility
// level. Kept fully modular and independent of the public (NHM) cascades. No React.

export interface PrivateTier {
  name: string
  share: number // % of delivering private facilities in this size tier
  cpap: number // CPAP devices per facility (normative for the tier)
}

export interface PrivateNorms {
  homes: number // private nursing homes <30 beds
  deliveryPct: number // % conducting deliveries
  tiers: PrivateTier[]
}

export const DEFAULT_PRIVATE: PrivateNorms = {
  homes: 37500,
  deliveryPct: 100,
  tiers: [
    { name: 'High · 3+ bed SNCU', share: 10, cpap: 4 },
    { name: 'Medium · 1–2 bed SNCU', share: 10, cpap: 2 },
    { name: 'Small · basic setup', share: 80, cpap: 1 },
  ],
}

export interface PrivateTierRow {
  name: string
  facilities: number
  cpapPer: number
  devices: number
}

export interface PrivateComputed {
  delivering: number // private facilities conducting deliveries
  tiers: PrivateTierRow[]
  devices: number // total private-sector CPAP devices
  shareTotal: number // sum of tier shares (should be 100)
}

export function computePrivate(n: PrivateNorms): PrivateComputed {
  const delivering = Math.round(n.homes * n.deliveryPct / 100)
  let devices = 0
  let shareTotal = 0
  const tiers = n.tiers.map((t) => {
    const facilities = Math.round(delivering * t.share / 100)
    const dev = facilities * t.cpap
    devices += dev
    shareTotal += t.share
    return { name: t.name, facilities, cpapPer: t.cpap, devices: dev }
  })
  return { delivering, tiers, devices, shareTotal }
}
