// Sourced justification for each forecast factor and its scenario values.
// Compiled from a research review (Oct 2026): MoHFW/NHM, WHO/UNICEF, FBNC 2025, and
// peer-reviewed India studies. Shown in the Forecasting tab's "evidence & sources" panel.

export interface EvidenceSource {
  label: string
  url?: string
}

export interface EvidenceItem {
  factor: string
  values?: string
  note: string
  sources: EvidenceSource[]
}

export const FORECAST_EVIDENCE: EvidenceItem[] = [
  {
    factor: 'SNCU / NICU growth rate',
    values: 'Baseline 6.6% · Moderate 8.5% · Accelerated 10% per year',
    note: 'India’s special newborn care units grew from about 400 in 2012 to 1,054 in 2024 — roughly 6–8% a year, and now slowing as nearly every district already has one. Baseline continues the realised decade pace (6.6%); Moderate matches the fastest decade India has achieved (~8.5%); Accelerated (10%) sits above any observed national rate and is only reachable by upgrading lower units and adding new ones.',
    sources: [
      { label: 'MoHFW, Lok Sabha reply, 26 Jul 2024 — 1,054 SNCUs/NICUs, 2,774 NBSUs', url: 'https://eparlib.nic.in' },
      { label: 'UNICEF India, 2024 — 1,054 SNCUs operating 24/7', url: 'https://www.unicef.org/india/stories/special-newborn-care-unit-breath-hope' },
      { label: 'India Newborn Action Plan (INAP) progress card, NHM 2020', url: 'https://nhm.gov.in/images/pdf/programmes/INAP-progress_card_2020.pdf' },
    ],
  },
  {
    factor: 'CPAP at NBSUs',
    values: 'Baseline 0% · Moderate 20% · Accelerated 40% of NBSUs',
    note: 'Today CPAP officially sits at SNCU and medical-college level, not at the smaller stabilisation units (NBSUs), whose role is to stabilise and refer — so Baseline keeps NBSU CPAP at zero. Low-cost bubble CPAP that nurses can run makes pushing it down a tier feasible (shown in Bihar and Mysuru), so Moderate assumes 1 in 5 and Accelerated 2 in 5 NBSUs within five years. No national policy mandates this yet; it depends on nurse training, clinical guidelines and maintenance.',
    sources: [
      { label: 'Dewez et al., BMJ Open 2020 — CPAP tier policy & readiness', url: 'https://bmjopen.bmj.com/content/10/2/e031128' },
      { label: 'Bubble CPAP feasibility, BMC Pediatrics 2018', url: 'https://bmcpediatr.biomedcentral.com/articles/10.1186/s12887-018-1311-8' },
      { label: 'Low-cost bubble CPAP, Mysuru, Frontiers in Pediatrics 2025', url: 'https://www.frontiersin.org/articles/10.3389/fped.2025.1685939/full' },
    ],
  },
  {
    factor: 'New MNCUs (Mother Newborn Care Units)',
    values: 'Accelerated only: 150 new units by year 5, ~3 CPAP each',
    note: 'An MNCU is a government-recognised “zero-separation” Level-II unit where the mother stays with and helps care for her sick newborn. It is written into the FBNC 2025 guidelines and backed by WHO and UNICEF, and these units carry CPAP. Only about 10–20 operate today, so 150 new units in five years is an aspirational upper bound used only in the Accelerated scenario; 3 CPAP per unit is reasonable for a 10–24-bed Level-II unit.',
    sources: [
      { label: 'WHO South-East Asia, 2022 — Mother Newborn Care Unit', url: 'https://www.who.int/southeastasia/news/feature-stories/detail/mother-newborn-care-unit' },
      { label: 'FBNC Operational Guidelines 2025, MoHFW', url: 'https://nhm.gov.in/images/pdf/programmes/CH-Programmes/FBNC/FBNC%20Operational%20Guidelines%202025.pdf' },
      { label: 'UNICEF India, 2025 — MNCU rollout (MP, UP, Bihar, Odisha)', url: 'https://www.unicef.org/india' },
    ],
  },
  {
    factor: 'Portable / transport CPAP',
    values: 'Baseline 0% · Moderate 5% · Accelerated 15% of SNCUs',
    note: 'Giving sick newborns CPAP during ambulance transfer is clinically sound and backed by national transport guidance (NNF 2023), and an Indian-made portable device (Saans) exists — but almost no public ambulances do it today. Reaching 5% of transfers (Moderate) is already a stretch; 15% (Accelerated) is optimistic and depends on funding transport devices, consumables and 102/108 crew training.',
    sources: [
      { label: 'NNF, Referral & Transport of Sick Neonates (CPG) 2023', url: 'https://app.magicapp.org/summary/guideline_6919.html' },
      { label: 'Portable CPAP in transport, India trial, IJCMPH 2022', url: 'https://www.ijcmph.com/index.php/ijcmph/article/view/9126' },
    ],
  },
  {
    factor: 'CPAP per SNCU',
    values: 'about 6 devices per SNCU',
    note: 'Carried from the Guidelines-based tab: average SNCU beds × the FBNC CPAP-per-bed norm × the planning buffer. Change those inputs there and this follows automatically.',
    sources: [
      { label: 'FBNC Operational Guidelines 2025, MoHFW', url: 'https://nhm.gov.in/images/pdf/programmes/CH-Programmes/FBNC/FBNC%20Operational%20Guidelines%202025.pdf' },
    ],
  },
  {
    factor: 'Utilisation (training + consumables)',
    values: 'Baseline 60% · Moderate 68% · Accelerated 80%',
    note: 'In India’s public units many CPAP machines are not in effective use — only ~37% of district hospitals actually used CPAP, about half lacked an oxygen blender or trained staff, and over half reused breathing circuits. So Baseline assumes ~60% of devices deliver care; Moderate and Accelerated raise this as training, consumables and power are strengthened. Trained nurses, a reliable oxygen supply and stocked single-use circuits are what lift it.',
    sources: [
      { label: 'Dewez et al., BMJ Open 2020 — CPAP availability & use', url: 'https://bmjopen.bmj.com/content/10/2/e031128' },
      { label: 'Neogi et al., Assessment of SNCUs in India, 2011', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3225112/' },
    ],
  },
  {
    factor: 'Device lifespan (replacement)',
    values: '7 years',
    note: 'Standard hospital-equipment life tables put respiratory devices like CPAP at roughly 7–10 years. Seven years is a reasonable, slightly conservative planning figure given India’s heavy use and power conditions; it drives how many devices must be replaced each year.',
    sources: [
      { label: 'AHA / ASHE estimated useful lives of hospital assets, 2023' },
      { label: 'WHO, Medical equipment inventory management, 2022', url: 'https://iris.who.int/handle/10665/381579' },
    ],
  },
  {
    factor: 'Unit price',
    values: '₹2.5 lakh per device',
    note: 'Recent state government tenders (Gujarat ~₹2.5 lakh, Jharkhand ~₹3 lakh) and the GeM marketplace show a complete bubble-CPAP unit — with oxygen blender, humidifier and oximeter — costs about ₹2.5–3 lakh. We use ₹2.5 lakh; a basic standalone generator can be cheaper and imported complete systems dearer (₹4–5 lakh).',
    sources: [
      { label: 'Gujarat (GMSCL) bubble CPAP tender, 2025 — ~₹2.5 lakh/unit' },
      { label: 'Jharkhand NHM bubble CPAP tender, 2026 — ~₹3 lakh/unit' },
      { label: 'UNICEF Supply Catalogue — bubble CPAP (indicative)', url: 'https://supply.unicef.org' },
    ],
  },
  {
    factor: 'Why scale up at all — national targets',
    note: 'India has committed, through the India Newborn Action Plan (single-digit newborn deaths by 2030), the National Health Policy 2017 (newborn mortality 16 by 2025) and the global SDG / Every Newborn Action Plan target (12 per 1,000 by 2030), to sharply cut newborn deaths. Newborn mortality (~20 in 2020) is still above these targets, so continued — and in places accelerated — expansion of newborn-care and CPAP capacity is directly justified by policy.',
    sources: [
      { label: 'India Newborn Action Plan (INAP), NHM — progress card 2020', url: 'https://nhm.gov.in/images/pdf/programmes/INAP-progress_card_2020.pdf' },
      { label: 'Every Newborn Action Plan (ENAP) / SDG 3.2, WHO 2014' },
    ],
  },
]
