// Method-2 (top-down) state inputs. Live births come from states.ts (SRS × projections).
//  lbw = low-birth-weight %, NFHS-5 2019-21 (all states).
//  idr = institutional-delivery rate %, NFHS-6 2023-24 (all states except Manipur = NFHS-5, not covered by NFHS-6).
//  nmr = neonatal mortality rate /1,000, SRS 2024 (bigger states/UTs only; null where SRS does not report).
// National refs: LBW 18.2% (NFHS-5) · institutional delivery 90.6% (NFHS-6) · NMR 18 (SRS 2024).
import { STATES } from './states'
import type { State2 } from '../engine/method2'

const M2: Record<string, { lbw: number; idr: number; nmr: number | null }> = {
  'Andhra Pradesh': { lbw: 16.2, idr: 98.4, nmr: 14 },
  'Arunachal Pradesh': { lbw: 10.6, idr: 88.7, nmr: null },
  'Assam': { lbw: 16.1, idr: 87.6, nmr: 20 },
  'Bihar': { lbw: 16.8, idr: 81.1, nmr: 17 },
  'Chhattisgarh': { lbw: 15.9, idr: 86.9, nmr: 26 },
  'Goa': { lbw: 14.0, idr: 99.6, nmr: null },
  'Gujarat': { lbw: 18.5, idr: 97.1, nmr: 15 },
  'Haryana': { lbw: 20.5, idr: 96.3, nmr: 17 },
  'Himachal Pradesh': { lbw: 15.8, idr: 91.7, nmr: 8 },
  'Jharkhand': { lbw: 15.6, idr: 77.4, nmr: 19 },
  'Karnataka': { lbw: 15.9, idr: 98.7, nmr: 11 },
  'Kerala': { lbw: 16.3, idr: 99.7, nmr: 6 },
  'Madhya Pradesh': { lbw: 20.5, idr: 89.8, nmr: 26 },
  'Maharashtra': { lbw: 20.0, idr: 96.4, nmr: 10 },
  'Manipur': { lbw: 7.2, idr: 79.9, nmr: null },
  'Meghalaya': { lbw: 11.7, idr: 65.6, nmr: null },
  'Mizoram': { lbw: 4.0, idr: 91.2, nmr: null },
  'Nagaland': { lbw: 4.7, idr: 62.2, nmr: null },
  'Odisha': { lbw: 19.2, idr: 93.9, nmr: 20 },
  'Punjab': { lbw: 22.4, idr: 96.1, nmr: 11 },
  'Rajasthan': { lbw: 17.7, idr: 94.1, nmr: 21 },
  'Sikkim': { lbw: 9.8, idr: 97.7, nmr: null },
  'Tamil Nadu': { lbw: 17.0, idr: 99.7, nmr: 8 },
  'Telangana': { lbw: 13.9, idr: 98.8, nmr: 13 },
  'Tripura': { lbw: 19.7, idr: 89.1, nmr: null },
  'Uttar Pradesh': { lbw: 20.2, idr: 85.9, nmr: 25 },
  'Uttarakhand': { lbw: 17.7, idr: 88.9, nmr: 13 },
  'West Bengal': { lbw: 19.0, idr: 94.9, nmr: 12 },
  'Andaman & Nicobar Islands': { lbw: 17.4, idr: 99.5, nmr: null },
  'Chandigarh': { lbw: 16.7, idr: 96.9, nmr: null },
  'Dadra & Nagar Haveli and Daman & Diu': { lbw: 20.8, idr: 96.3, nmr: null },
  'Delhi': { lbw: 22.1, idr: 93.1, nmr: 7 },
  'Jammu & Kashmir': { lbw: 10.7, idr: 93.6, nmr: 10 },
  'Ladakh': { lbw: 11.6, idr: 98.0, nmr: null },
  'Lakshadweep': { lbw: 9.7, idr: 100.0, nmr: null },
  'Puducherry': { lbw: 13.7, idr: 99.8, nmr: null },
}

export const STATES2: State2[] = STATES.map((s) => {
  const d = M2[s.state]
  return { state: s.state, ut: s.ut, births: s.births, idr: d.idr / 100, lbw: d.lbw, nmr: d.nmr }
})

/** state -> institutional-delivery rate (fraction 0..1), NFHS-6 (Manipur NFHS-5). Single source for both methods. */
export const IDR_BY_STATE: Record<string, number> = Object.fromEntries(STATES2.map((s) => [s.state, s.idr]))
