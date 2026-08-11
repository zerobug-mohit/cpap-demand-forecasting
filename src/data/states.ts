// State-wise inputs for Method 1 (bottom-up).
//  sncu  = operational SNCUs incl. NICUs — MoHFW/DoHFW Annual Report 2024-25 (units "as on Oct 2024", p.62).
//  nbsu, nbcc = same source (reference only; carry no CPAP under FBNC norms).
//  births = est. annual live births = Population 2026 (NCP projection) × SRS 2024 CBR.
// National checks: SNCU 1056 · NBSU 3218 · NBCC 22150 · est. live births ~2.66 crore.

export type Region = 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast'

export interface StateRow {
  state: string
  region: Region
  ut?: boolean
  sncu: number
  nbsu: number
  nbcc: number
  births: number
}

export const STATES: StateRow[] = [
  { state: 'Uttar Pradesh',    region: 'Central', sncu: 99, nbsu: 436, nbcc: 2240, births: 5721451 },
  { state: 'Bihar',            region: 'East',    sncu: 45, nbsu: 41,  nbcc: 812,  births: 3560380 },
  { state: 'Madhya Pradesh',   region: 'Central', sncu: 62, nbsu: 343, nbcc: 1408, births: 2024212 },
  { state: 'Rajasthan',        region: 'West',    sncu: 62, nbsu: 284, nbcc: 2065, births: 1912441 },
  { state: 'Maharashtra',      region: 'West',    sncu: 69, nbsu: 205, nbcc: 1779, births: 1788259 },
  { state: 'West Bengal',      region: 'East',    sncu: 69, nbsu: 286, nbcc: 475,  births: 1398771 },
  { state: 'Gujarat',          region: 'West',    sncu: 54, nbsu: 151, nbcc: 1701, births: 1248963 },
  { state: 'Karnataka',        region: 'South',   sncu: 50, nbsu: 165, nbcc: 1070, births: 1029203 },
  { state: 'Tamil Nadu',       region: 'South',   sncu: 88, nbsu: 145, nbcc: 2429, births: 899951 },
  { state: 'Jharkhand',        region: 'East',    sncu: 26, nbsu: 46,  nbcc: 594,  births: 883822 },
  { state: 'Andhra Pradesh',   region: 'South',   sncu: 61, nbsu: 163, nbcc: 1306, births: 768482 },
  { state: 'Odisha',           region: 'East',    sncu: 44, nbsu: 72,  nbcc: 533,  births: 746091 },
  { state: 'Assam',            region: 'Northeast', sncu: 36, nbsu: 173, nbcc: 1086, births: 721574 },
  { state: 'Chhattisgarh',     region: 'Central', sncu: 29, nbsu: 178, nbcc: 1704, births: 695105 },
  { state: 'Telangana',        region: 'South',   sncu: 45, nbsu: 47,  nbcc: 562,  births: 607040 },
  { state: 'Haryana',          region: 'North',   sncu: 29, nbsu: 66,  nbcc: 430,  births: 581067 },
  { state: 'Kerala',           region: 'South',   sncu: 23, nbsu: 64,  nbcc: 98,   births: 402253 },
  { state: 'Punjab',           region: 'North',   sncu: 24, nbsu: 86,  nbcc: 208,  births: 426632 },
  { state: 'Delhi',            region: 'North',   ut: true, sncu: 30, nbsu: 0,   nbcc: 57,  births: 290228 },
  { state: 'Uttarakhand',      region: 'North',   sncu: 12, nbsu: 37,  nbcc: 289,  births: 200867 },
  { state: 'Jammu & Kashmir',  region: 'North',   ut: true, sncu: 32, nbsu: 65,  nbcc: 264, births: 203334 },
  { state: 'Himachal Pradesh', region: 'North',   sncu: 16, nbsu: 51,  nbcc: 124,  births: 106232 },
  { state: 'Meghalaya',        region: 'Northeast', sncu: 7, nbsu: 17, nbcc: 148,  births: 76179 },
  { state: 'Tripura',          region: 'Northeast', sncu: 7, nbsu: 16, nbcc: 125,  births: 64020 },
  { state: 'Manipur',          region: 'Northeast', sncu: 5, nbsu: 10, nbcc: 69,   births: 42139 },
  { state: 'Dadra & Nagar Haveli and Daman & Diu', region: 'West', ut: true, sncu: 2, nbsu: 1, nbcc: 14, births: 24691 },
  { state: 'Nagaland',         region: 'Northeast', sncu: 5, nbsu: 16, nbcc: 156,  births: 30576 },
  { state: 'Arunachal Pradesh', region: 'Northeast', sncu: 5, nbsu: 24, nbcc: 169, births: 26210 },
  { state: 'Puducherry',       region: 'South',   ut: true, sncu: 4, nbsu: 6,   nbcc: 10,  births: 21252 },
  { state: 'Goa',              region: 'West',    sncu: 3, nbsu: 1,   nbcc: 9,    births: 17131 },
  { state: 'Mizoram',          region: 'Northeast', sncu: 5, nbsu: 6, nbcc: 124,  births: 17850 },
  { state: 'Chandigarh',       region: 'North',   ut: true, sncu: 3, nbsu: 3,   nbcc: 7,   births: 13843 },
  { state: 'Sikkim',           region: 'Northeast', sncu: 2, nbsu: 3, nbcc: 44,   births: 10352 },
  { state: 'Ladakh',           region: 'North',   ut: true, sncu: 2, nbsu: 5,   nbcc: 16,  births: 4407 },
  { state: 'Andaman & Nicobar Islands', region: 'East', ut: true, sncu: 1, nbsu: 6, nbcc: 20, births: 4020 },
  { state: 'Lakshadweep',      region: 'South',   ut: true, sncu: 0, nbsu: 0,   nbcc: 5,   births: 903 },
]
