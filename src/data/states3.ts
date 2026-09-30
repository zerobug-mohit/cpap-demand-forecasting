// State/UT-wise counts of the four public facility tiers used by the facility-based
// (Cascade B) CPAP need model. Source: Health Dynamics of India (Infrastructure &
// Human Resources) 2022-23, MoHFW — Table 6 (CHC, rural+urban, p. 123) and Table 7
// (Sub-Divisional Hospitals, District Hospitals, Medical Colleges, p. 124), as on
// 31 March 2023. Column totals reconcile exactly with the national model defaults
// (DH 714 · SDH 1,340 · CHC 6,359 · govt medical colleges 362).
// Medical Colleges = government/public medical colleges only (not the ~700 incl. private).

export interface FacilityCounts {
  dh: number // District Hospitals
  sdh: number // Sub-Divisional / Sub-District Hospitals
  chc: number // Community Health Centres (rural + urban)
  mc: number // Government medical colleges
}

export const FACILITIES_BY_STATE: Record<string, FacilityCounts> = {
  'Uttar Pradesh': { dh: 125, sdh: 0, chc: 950, mc: 46 },
  'Bihar': { dh: 36, sdh: 45, chc: 306, mc: 11 },
  'Madhya Pradesh': { dh: 52, sdh: 144, chc: 353, mc: 13 },
  'Rajasthan': { dh: 37, sdh: 30, chc: 718, mc: 41 },
  'Maharashtra': { dh: 22, sdh: 95, chc: 481, mc: 24 },
  'West Bengal': { dh: 14, sdh: 69, chc: 349, mc: 24 },
  'Gujarat': { dh: 20, sdh: 56, chc: 370, mc: 20 },
  'Karnataka': { dh: 16, sdh: 147, chc: 212, mc: 19 },
  'Tamil Nadu': { dh: 20, sdh: 281, chc: 423, mc: 42 },
  'Jharkhand': { dh: 21, sdh: 13, chc: 195, mc: 6 },
  'Andhra Pradesh': { dh: 12, sdh: 53, chc: 175, mc: 16 },
  'Odisha': { dh: 32, sdh: 33, chc: 385, mc: 9 },
  'Assam': { dh: 21, sdh: 16, chc: 205, mc: 12 },
  'Chhattisgarh': { dh: 26, sdh: 15, chc: 169, mc: 8 },
  'Telangana': { dh: 6, sdh: 42, chc: 86, mc: 9 },
  'Haryana': { dh: 22, sdh: 28, chc: 142, mc: 5 },
  'Kerala': { dh: 47, sdh: 87, chc: 230, mc: 9 },
  'Punjab': { dh: 23, sdh: 41, chc: 162, mc: 3 },
  'Delhi': { dh: 40, sdh: 10, chc: 0, mc: 13 },
  'Uttarakhand': { dh: 13, sdh: 21, chc: 78, mc: 3 },
  'Jammu & Kashmir': { dh: 13, sdh: 0, chc: 80, mc: 10 },
  'Himachal Pradesh': { dh: 9, sdh: 89, chc: 102, mc: 6 },
  'Meghalaya': { dh: 11, sdh: 1, chc: 29, mc: 1 },
  'Tripura': { dh: 7, sdh: 15, chc: 21, mc: 1 },
  'Manipur': { dh: 7, sdh: 1, chc: 17, mc: 2 },
  'Dadra & Nagar Haveli and Daman & Diu': { dh: 2, sdh: 1, chc: 4, mc: 1 },
  'Nagaland': { dh: 12, sdh: 0, chc: 23, mc: 0 },
  'Arunachal Pradesh': { dh: 20, sdh: 0, chc: 57, mc: 1 },
  'Puducherry': { dh: 4, sdh: 0, chc: 4, mc: 2 },
  'Goa': { dh: 2, sdh: 2, chc: 6, mc: 1 },
  'Mizoram': { dh: 12, sdh: 2, chc: 9, mc: 1 },
  'Chandigarh': { dh: 1, sdh: 1, chc: 2, mc: 2 },
  'Sikkim': { dh: 4, sdh: 0, chc: 2, mc: 0 },
  'Ladakh': { dh: 2, sdh: 0, chc: 7, mc: 0 },
  'Andaman & Nicobar Islands': { dh: 2, sdh: 0, chc: 4, mc: 1 },
  'Lakshadweep': { dh: 1, sdh: 2, chc: 3, mc: 0 },
}
