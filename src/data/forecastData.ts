// Growth inputs for the forecast, derived from sourced series (see notes).
// SNCU CAGR: fitted log-linear over a CONSISTENT "established/set-up" national series —
//   548 (INAP 2014) · 794 (MoHFW AR 2018-19) · 894 (INAP card 2020) · 1,056 (MoHFW AR 2024-25, Oct-24).
//   Log-linear fit = 6.6%/yr (R²≈0.95); the old 565→1,056 = 7.2% mixed a *functional* 2015 count with a
//   *set-up* 2024 count and over-stated growth. Base SNCU counts (states.ts) are the same Oct-24 set-up basis,
//   so 6.6% is internally consistent. Per-state historical counts are not reliably published -> national fallback.
//   (Caveat: the 2024 *functional* count is 979 vs 1,056 set-up, i.e. ~7% of established units not currently
//    functional — one reason not to assume accelerating growth.)
// IDR CAGR: NFHS-5 (2019-21) -> NFHS-6 (2023-24), per state (~3.5-yr), floored at 0.
// Births CAGR: NCP Population Projections 2011-2036 (reconstructed births, 2021-25 -> 2031-35, 10-yr);
//   NE states use the NCP combined-NE figure; Goa & small UTs fall back to national.
import type { SourceKey } from './sources'
import type { GrowthData } from '../engine/forecast'

/** Published national SNCU counts (established/set-up basis) that the SNCU CAGR is fitted to. */
export const SNCU_HISTORY: { label: string; count: number; sourceKey: SourceKey; page: string }[] = [
  { label: '2014', count: 548, sourceKey: 'inap2014', page: 'FBNC — 548 established' },
  { label: '2018-19', count: 794, sourceKey: 'mohfwAR1819', page: 'Ch. 4 — 794 set up' },
  { label: '2020', count: 894, sourceKey: 'inapCard2020', page: '894 established' },
  { label: '2024', count: 1056, sourceKey: 'mohfwAR', page: 'p. 62 — 1,056 set up' },
]

export const GROWTH: GrowthData = {
  sncuCagr: {},                 // no reliable per-state historical -> all use nationalSncuCagr
  nationalSncuCagr: 0.066,
  idrCagr: {
    "Andhra Pradesh": 0.0056,
    "Arunachal Pradesh": 0.0329,
    "Assam": 0.0117,
    "Bihar": 0.018,
    "Chhattisgarh": 0.004,
    "Goa": 0.0,
    "Gujarat": 0.0084,
    "Haryana": 0.0042,
    "Himachal Pradesh": 0.0112,
    "Jharkhand": 0.006,
    "Karnataka": 0.005,
    "Kerala": 0.0,
    "Madhya Pradesh": 0.0,
    "Maharashtra": 0.0051,
    "Manipur": 0.0,
    "Meghalaya": 0.0353,
    "Mizoram": 0.0176,
    "Nagaland": 0.0921,
    "Odisha": 0.0052,
    "Punjab": 0.0054,
    "Rajasthan": 0.0,
    "Sikkim": 0.009,
    "Tamil Nadu": 0.0003,
    "Telangana": 0.0053,
    "Tripura": 0.0,
    "Uttar Pradesh": 0.0085,
    "Uttarakhand": 0.0191,
    "West Bengal": 0.0098,
    "Andaman & Nicobar Islands": 0.0017,
    "Chandigarh": 0.0,
    "Dadra & Nagar Haveli and Daman & Diu": 0.0,
    "Delhi": 0.004,
    "Jammu & Kashmir": 0.0037,
    "Ladakh": 0.0086,
    "Lakshadweep": 0.0011,
    "Puducherry": 0.0006,
  },
  birthsCagr: {
  "Andhra Pradesh": -0.0189,
  "Himachal Pradesh": -0.0142,
  "Punjab": -0.0133,
  "Uttarakhand": -0.0111,
  "Haryana": -0.0077,
  "Delhi": 0.0049,
  "Rajasthan": -0.0145,
  "Uttar Pradesh": -0.02,
  "Bihar": -0.0055,
  "Assam": -0.0086,
  "West Bengal": -0.0151,
  "Jharkhand": -0.008,
  "Odisha": -0.0133,
  "Chhattisgarh": -0.0095,
  "Madhya Pradesh": -0.0138,
  "Gujarat": -0.0115,
  "Maharashtra": -0.0112,
  "Karnataka": -0.0099,
  "Kerala": -0.0063,
  "Tamil Nadu": -0.0143,
  "Telangana": -0.0196,
  "Jammu & Kashmir": 0.0017,
  "Arunachal Pradesh": -0.0068,
  "Manipur": -0.0068,
  "Meghalaya": -0.0068,
  "Mizoram": -0.0068,
  "Nagaland": -0.0068,
  "Sikkim": -0.0068,
  "Tripura": -0.0068,
},
  nationalBirthsCagr: -0.0126,
}
