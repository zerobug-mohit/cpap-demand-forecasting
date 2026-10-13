// Inputs for the Forecasting tab's MNCU and ambulance factors, with their sources.

/** Facility levels (keys of the Epidemiological Need tab's facility counts) that host a Mother-Newborn Care Unit.
 *  FBNC Operational Guidelines 2025 (MoHFW), pp. 22–23, 29, 54: level II newborn care sits at district hospitals and
 *  medical colleges, one SNCU/MNCU per district hospital, and every new district-level unit is to be an MNCU.
 *  Sub-district hospitals with more than 3,000 deliveries a year also qualify (p. 27) but have no national count,
 *  so they are left out. */
export const MNCU_TIERS: readonly string[] = ['dh', 'mc']
/** CPAP per MNCU: 4 bubble CPAP for a 12-bed unit (FBNC 2025, Table 14, p. 57; layout p. 55). */
export const CPAP_PER_MNCU = 4
export const MNCU_SOURCE = 'FBNC 2025'

/** ALS ambulances operational under NHM on 31 March 2026 (NHM MIS Executive Summary, p. 7, item 105).
 *  Only ALS (Type D) ambulances carry the neonatal transport ventilator with a CPAP mode (Dte.GHS
 *  specification of equipment for ERS ambulances v2.0, 2016, item 27); BLS ambulances do not. */
export const ALS_AMBULANCES = 3330
export const BLS_AMBULANCES = 15547
export const ALS_SOURCE = 'NHM MIS, March 2026'

/** Simulation ranges, as shares by the end of the horizon: lo = Baseline (none added), hi = the stretch
 *  value the scenarios are built from, grid = values tried (reaching past the stretch). MNCUs are only
 *  starting to open (2025-26), and FBNC 2025 calls ambulance CPAP desirable rather than essential. */
export const MNCU_LEVER = { lo: 0, hi: 70, grid: [0, 35, 70, 100] }
export const ALS_LEVER = { lo: 0, hi: 60, grid: [0, 30, 60, 100] }
/** CPAP per MNCU: the scenarios keep the FBNC norm; the simulation also tries a smaller unit (an 8-bed MNCU,
 *  allowed in NE, hilly and LWE areas, FBNC p. 50) and a bigger one (about 30% of 16 beds, FBNC p. 60). */
export const CPAP_PER_MNCU_LEVER = { lo: CPAP_PER_MNCU, hi: CPAP_PER_MNCU, grid: [2, 4, 6] }
