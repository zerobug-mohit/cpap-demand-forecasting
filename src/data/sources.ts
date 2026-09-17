// Central registry of data/norm sources. Every sourced figure in the UI links here
// so users can click through to the exact document for verification.
export interface Source {
  label: string
  url: string
}

export const SOURCES = {
  fbnc2025: {
    label: 'FBNC Operational Guidelines 2025 (MoHFW)',
    url: 'https://nhm.gov.in/images/pdf/programmes/CH-Programmes/FBNC/FBNC%20Operational%20Guidelines%202025.pdf',
  },
  iphs2022: {
    label: 'IPHS 2022, Vol. I — SDH & DH (MoHFW)',
    url: 'https://nhm.gov.in/images/pdf/guidelines/iphs/iphs-revised-guidlines-2022/01-SDH_DH_IPHS_Guidelines-2022.pdf',
  },
  inap2014: {
    label: 'India Newborn Action Plan 2014 (MoHFW)',
    url: 'https://nhm.gov.in/images/pdf/programmes/inap-final.pdf',
  },
  mohfwAR: {
    label: 'MoHFW/DoHFW Annual Report 2024-25 (p. 62)',
    url: 'https://www.mohfw-dohfw.gov.in/static/uploads/2025/09/45b06af4508a53a059c74efc930d955e.pdf',
  },
  mohfwAR1819: {
    label: 'MoHFW Annual Report 2018-19, Ch. 4 Child Health (794 SNCUs set up)',
    url: 'https://mohfw.gov.in/sites/default/files/04%20ChapterAN2018-19.pdf',
  },
  inapCard2020: {
    label: 'India Newborn Action Plan — Progress Card 2020 (894 SNCUs established)',
    url: 'https://nhm.gov.in/images/pdf/programmes/INAP-progress_card_2020.pdf',
  },
  sncuOnline: {
    label: 'SNCU-online portal (MoHFW)',
    url: 'https://sncuindiaonline.org',
  },
  srs2021: {
    label: 'SRS Statistical Report 2021 (ORGI)',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/45556/download/49753/SRS_STAT_2021.pdf',
  },
  ncpProj: {
    label: 'Population Projections 2011-2036 (NCP, MoHFW)',
    url: 'https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf',
  },
  nhmSncu2013: {
    label: 'Two-Year Progress of SNCUs, 2013 (NHM)',
    url: 'https://nhm.gov.in/images/pdf/programmes/child-health/annual-report/Two_Year_Progress_of_SNCUs-A_Brief_Report_(2011-12_&_2012-13).pdf',
  },
  nfhs5: {
    label: 'NFHS-5 (2019-21) — IIPS/MoHFW (DHS FR375)',
    url: 'https://dhsprogram.com/pubs/pdf/FR375/FR375.pdf',
  },
  nfhs4: {
    label: 'NFHS-4 (2015-16) — IIPS (DHS OF31 fact sheets)',
    url: 'https://dhsprogram.com/publications/publication-OF31-Other-Fact-Sheets.cfm',
  },
  nfhs6: {
    label: 'NFHS-6 (2023-24) — IIPS fact sheets (May 2026)',
    url: 'https://www.nfhsiips.in/nfhsuser/assets/National%20Family%20Health%20Survey%20(NFHS-6)%202023-2024%20Fact%20Sheets.pdf',
  },
  srs2024: {
    label: 'SRS Statistical Report 2024 — ORGI',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/47152/download/51396/SRS_STAT_2024.pdf',
  },
  srs2020: {
    label: 'SRS Statistical Report 2020 — ORGI (Statement 48)',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/44376/download/48048/SRS_STAT_2020.pdf',
  },
  nnpd: {
    label: 'NNPD 2002-03 — National Neonatal-Perinatal Database (ICMR/NNF)',
    url: 'http://www.newbornwhocc.org/pdf/nnpd_report_2002-03.pdf',
  },
  rdsRecent: {
    label: 'Maryam et al. 2024, IJCP — Aligarh (RDS 25.3/1,000 births)',
    url: 'https://www.ijpediatrics.com/index.php/ijcp/article/view/6287',
  },
  rdsAIIMS: {
    label: 'Singh, Deorari et al. 1991, Indian J Med Res — AIIMS (HMD 19.1/1,000)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1937600/',
  },
  rdsAFMC: {
    label: 'Nagendra et al. 1999, MJAFI — AFMC Pune (HMD 4.5/1,000)',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5531936/',
  },
  cpapMathai: {
    label: 'Mathai et al. 2014, MJAFI — bubble CPAP, Indian neonates',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4223220/',
  },
  cpapKoti: {
    label: 'Koti, Murki et al. 2010, Indian Pediatr — Hyderabad (median CPAP 23.5 h ≈ 1.0 d)',
    url: 'https://www.indianpediatrics.net/feb2010/139.pdf',
  },
  cpapNoolu: {
    label: 'Kuppireddy & Noolu 2025, IJMEDPH — Srikakulam (mean CPAP 54.6 h ≈ 2.3 d)',
    url: 'https://www.ijmedph.org/Uploads/Volume15Issue2/229.%202227.%20IJMEDPH_Arpita_1272-1277.pdf',
  },
  cpapTahreem: {
    label: 'Tahreem, Malagi & Thobbi 2025, IJCP — Vijayapura (mean bCPAP 72.1 h ≈ 3.0 d)',
    url: 'https://www.ijpediatrics.com/index.php/ijcp/article/view/6921',
  },
  distJain: {
    label: 'Jain et al. 2025, IJMEDPH — Navi Mumbai (CPAP 68% of resp-distress; RDS 32.8%)',
    url: 'https://ijmedph.org/Uploads/Volume15Issue1/195.%20%5B1610.%20IJMEDPH_Rahul%20Singh%5D%201043-1046.pdf',
  },
  // ── Facility-based need cascade (epidemiological · Cascade B) ──
  healthDynamics: {
    label: 'Health Dynamics of India (Infra & Human Resources) 2022-23 — MoHFW (PIB release)',
    url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2053070',
  },
  nmcColleges: {
    label: 'National Medical Commission — list of medical colleges',
    url: 'https://www.nmc.org.in/information-desk/college-and-course-search/',
  },
  sharmaBmj: {
    label: 'Sharma et al. 2018, BMJ Global Health — public-facility delivery volumes (CHC median ~490/yr)',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5988146/',
  },
  manyata: {
    label: 'Manyata evaluation 2019, BMC Health Serv Res — private maternity sector (mostly small facilities)',
    url: 'https://bmchealthservres.biomedcentral.com/articles/10.1186/s12913-019-4782-x',
  },
  indiaHospEco: {
    label: "India's hospital ecosystem — private nursing homes <30 beds (~35,000–40,000)",
    url: 'https://www.meddeviceonline.com/doc/understanding-india-s-hospital-ecosystem-a-guide-for-medical-device-companies-0001',
  },
} satisfies Record<string, Source>

export type SourceKey = keyof typeof SOURCES
