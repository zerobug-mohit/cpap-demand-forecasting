// The user guides: the steps shown at the top of each page, and the guided tours.
// A page step points at an element marked data-step="<id>". A tour step points at any CSS selector,
// and can move the app to a page first. All text is plain English in full sentences.

export type Section = 'start' | 'estimation' | 'forecasting' | 'private'
export type TdApproach = 'rds' | 'facility'
export type PvtApproach = 'homes' | 'rds'

/** A place in the tool: a main tab, its sub-tab, and the approach chosen inside it. */
export interface Place {
  section: Section
  sub?: string
  td?: TdApproach
  pvt?: PvtApproach
}

export type PageKey = 'bu' | 'td-facility' | 'td-rds' | 'cmp' | 'fc' | 'pvt-homes' | 'pvt-rds'

export interface PageStep {
  id: string
  label: string
}

const RDS_STEPS: PageStep[] = [
  { id: 'rds-inputs', label: 'Check the inputs' },
  { id: 'rds-how', label: 'How it is worked out' },
  { id: 'rds-result', label: 'The result' },
  { id: 'rds-states', label: 'State by state' },
  { id: 'rds-limits', label: 'Limits' },
]

export const PAGE_STEPS: Record<PageKey, PageStep[]> = {
  bu: [
    { id: 'bu-inputs', label: 'Check the inputs' },
    { id: 'bu-how', label: 'How it is worked out' },
    { id: 'bu-result', label: 'The result' },
    { id: 'bu-states', label: 'State by state' },
    { id: 'bu-sources', label: 'Sources' },
  ],
  'td-facility': [
    { id: 'fac-inputs', label: 'Check the inputs' },
    { id: 'fac-result', label: 'The result' },
    { id: 'fac-levels', label: 'By facility level' },
    { id: 'fac-states', label: 'State by state' },
    { id: 'fac-limits', label: 'Limits' },
  ],
  'td-rds': RDS_STEPS,
  cmp: [
    { id: 'cmp-area', label: 'Choose an area' },
    { id: 'cmp-installed', label: 'Installed machines' },
    { id: 'cmp-states', label: 'All states compared' },
    { id: 'cmp-read', label: 'How to read it' },
  ],
  fc: [
    { id: 'fc-how', label: 'How it works' },
    { id: 'fc-inputs', label: 'Your combination' },
    { id: 'fc-chart', label: 'Every combination' },
    { id: 'fc-scenarios', label: 'Three scenarios' },
    { id: 'fc-factors', label: 'What matters most' },
    { id: 'fc-method', label: 'Methodology' },
  ],
  'pvt-homes': [
    { id: 'homes-inputs', label: 'Check the inputs' },
    { id: 'homes-result', label: 'The result' },
    { id: 'homes-groups', label: 'By size group' },
    { id: 'homes-limits', label: 'Limits' },
  ],
  'pvt-rds': RDS_STEPS,
}

/** Which page (and so which steps and tour) a place shows. Null for the Start here page. */
export function pageOf(p: Place): PageKey | null {
  if (p.section === 'start') return null
  if (p.section === 'forecasting') return 'fc'
  if (p.section === 'private') return p.pvt === 'rds' ? 'pvt-rds' : 'pvt-homes'
  if (p.sub === 'td') return p.td === 'facility' ? 'td-facility' : 'td-rds'
  if (p.sub === 'cmp') return 'cmp'
  return 'bu'
}

// ---------------- guided tours ----------------

export type TrackKey = 'around' | PageKey

export interface TourStep {
  /** CSS selector of the part to point at. Leave out for a card in the middle of the screen. */
  target?: string
  title: string
  body: string
  /** Where to go before showing this step. Defaults to the tour's own page. */
  place?: Place
}

export interface Track {
  key: TrackKey
  label: string
  desc: string
  place: Place
  steps: TourStep[]
}

const at = (id: string) => `[data-step="${id}"]`

const BU: Place = { section: 'estimation', sub: 'bu' }
const TD_FAC: Place = { section: 'estimation', sub: 'td', td: 'facility' }
const TD_RDS: Place = { section: 'estimation', sub: 'td', td: 'rds' }
const CMP: Place = { section: 'estimation', sub: 'cmp' }
const FC: Place = { section: 'forecasting', sub: 'fc' }
const PVT_HOMES: Place = { section: 'private', sub: 'pvt', pvt: 'homes' }
const PVT_RDS: Place = { section: 'private', sub: 'pvt', pvt: 'rds' }

export const TRACKS: Track[] = [
  {
    key: 'around',
    label: 'Getting around the tool',
    desc: 'The main tabs, the steps on each page, the bulbs and the tours.',
    place: { section: 'start' },
    steps: [
      {
        title: 'Welcome',
        body: 'This tool estimates how many CPAP machines India’s newborn units need today, and how public demand could grow. This short tour shows you how to move around it. Use Next and Back, or the arrow keys. Press Exit or Esc to stop at any time.',
      },
      {
        target: '[data-tour="nav-primary"]',
        title: 'The main tabs',
        body: 'Start here is this page. The next two tabs cover the public sector: the demand today, and the forecast of future demand. The last tab covers the private sector.',
      },
      {
        target: '[data-tour="cover-approaches"] .approach',
        title: 'Every approach in one list',
        body: 'Each way of estimating demand has a row like this one, with its result. Open takes you to that approach. Take the tour walks you through it, one part at a time.',
      },
      {
        target: '[data-tour="step-track"]',
        place: BU,
        title: 'Steps on each page',
        body: 'Each page lists its steps in order at the top. The step you are reading is highlighted. Click any step to jump to it.',
      },
      {
        target: 'main .explain-btn',
        place: BU,
        title: 'Bulbs explain each part',
        body: 'Click a bulb to read what a part shows, how it is worked out and how to read it. Click the bulb again to close the note.',
      },
      {
        target: '[data-tour="guides-switch"]',
        place: BU,
        title: 'Show or hide the bulbs',
        body: 'Turn guides off to hide every bulb, for example when you present to a room. Turn them on again at any time.',
      },
      {
        target: '[data-tour="tour-button"]',
        place: BU,
        title: 'A tour for every approach',
        body: 'Open Guided tour to pick a walkthrough for any approach or for the forecast. Each one takes about two minutes.',
      },
    ],
  },
  {
    key: 'bu',
    label: 'Guidelines-based current demand',
    desc: 'How many machines the SNCUs that exist today need under the FBNC 2025 norm.',
    place: BU,
    steps: [
      {
        title: 'Guidelines-based current demand',
        body: 'This approach answers one question: how many CPAP machines do the special newborn care units (SNCUs) that exist today need under the government’s FBNC 2025 guidelines? It does not ask how many newborns need CPAP. The Epidemiological Need tab does that.',
      },
      {
        target: at('bu-inputs'),
        title: 'Check the inputs',
        body: 'These are the assumptions. The presets give each SNCU 16 beds on average, and a CPAP machine for 30% of SNCU beds, as FBNC suggests. A 25% planning buffer is added on top. Move a slider to change a value. Reset brings back the presets.',
      },
      {
        target: at('bu-how'),
        title: 'How it is worked out',
        body: 'Click this heading to see the calculation step by step: SNCUs × beds per SNCU × CPAP per bed, plus the buffer. You can follow it for India or for one state.',
      },
      {
        target: at('bu-result'),
        title: 'The result',
        body: 'The first box is the answer: the CPAP machines that today’s SNCUs need, including the buffer. The other boxes show the beds and the SNCUs it is based on.',
      },
      {
        target: at('bu-states'),
        title: 'State by state',
        body: 'See the result for every state as a map, a chart or a table. Six states have reported how many machines are installed. The chart and the table compare these counts with the estimate.',
      },
      {
        target: at('bu-sources'),
        title: 'Sources',
        body: 'This card explains the method in full and links to every source document, so you can check each number.',
      },
      {
        title: 'Try it yourself',
        body: 'Change the average beds per SNCU on the left and watch every number update. Press Reset when you are done. Your changes stay until you reload the page.',
      },
    ],
  },
  {
    key: 'td-facility',
    label: 'Epidemiological need: facility-based',
    desc: 'How many machines the public delivery network needs for the deliveries it does.',
    place: TD_FAC,
    steps: [
      {
        title: 'Facility-based need',
        body: 'This approach estimates how many CPAP machines public hospitals would need if every one were equipped to the FBNC norm for the deliveries it does. It covers district hospitals, government medical colleges, sub-district hospitals and community health centres.',
      },
      {
        target: '[data-tour="td-switch"]',
        title: 'Two ways to estimate need',
        body: 'This tab has two approaches. This tour covers Deliveries × FBNC norms. The other approach, RDS prevalence, has its own tour.',
      },
      {
        target: at('fac-inputs'),
        title: 'Check the inputs',
        body: 'The FBNC norm is 4 SNCU beds per 1,000 deliveries, with a CPAP machine for 30% of those beds. That gives 1.2 machines per 1,000 deliveries. Every sub-district hospital and community health centre gets at least one machine. Open the sections below to see the facility counts and average deliveries.',
      },
      {
        target: at('fac-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed, including a 25% planning buffer. The other boxes show the deliveries and the facilities counted.',
      },
      {
        target: at('fac-levels'),
        title: 'By facility level',
        body: 'The bars compare the machines needed at each level of facility. The full breakdown below splits each level into high, medium and low workload groups.',
      },
      {
        target: at('fac-states'),
        title: 'State by state',
        body: 'The same calculation for each state, based on its own count of each type of facility. Use the map or the table.',
      },
      {
        target: at('fac-limits'),
        title: 'Limits',
        body: 'This card lists what the estimate leaves out and which numbers are assumptions. Read it before you quote the total.',
      },
    ],
  },
  {
    key: 'td-rds',
    label: 'Epidemiological need: RDS-based',
    desc: 'How many machines the newborns in public facilities who are likely to need CPAP require.',
    place: TD_RDS,
    steps: [
      {
        title: 'RDS-based need',
        body: 'This approach starts from newborns, not from facilities. It works out how many newborns born in public facilities are likely to need CPAP, and how many machines they need. RDS, respiratory distress syndrome, is a breathing problem common in babies born early.',
      },
      {
        target: '[data-tour="td-switch"]',
        title: 'Two ways to estimate need',
        body: 'This tour covers RDS prevalence. The other approach, Deliveries × FBNC norms, has its own tour.',
      },
      {
        target: at('rds-inputs'),
        title: 'Check the inputs',
        body: 'The presets count 25 RDS cases per 1,000 facility births, and double this to cover other breathing problems treated with CPAP. Each newborn spends 5 days on CPAP, and a 25% planning buffer is added. Open a section to see or change its settings.',
      },
      {
        target: at('rds-how'),
        title: 'How it is worked out',
        body: 'Click this heading to see the calculation with real numbers, from live births to machines. You can follow it for India or for one state.',
      },
      {
        target: at('rds-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed. The others show the births counted, the newborns likely to need CPAP, and how the total is shared among states.',
      },
      {
        target: at('rds-states'),
        title: 'State by state',
        body: 'The national number is shared among states using their facility births, low birth weight and newborn deaths. See each state’s share as a map, a chart or a table.',
      },
      {
        target: at('rds-limits'),
        title: 'Limits',
        body: 'This card lists the main limits of this approach. Treat each state figure as its fair share of the national need, not as a count made in that state.',
      },
    ],
  },
  {
    key: 'cmp',
    label: 'Compare the public estimates',
    desc: 'The public estimates side by side, with installed machines where states report them.',
    place: CMP,
    steps: [
      {
        title: 'Compare the estimates',
        body: 'The approaches answer different questions, so their results differ. This page puts the public results side by side, for India and for each state.',
      },
      {
        target: at('cmp-area'),
        title: 'Choose an area',
        body: 'Pick India or one state. The bar shows current demand, the two estimates of need and, where reported, the machines installed. The gap between current demand and need is what the public system would still have to add.',
      },
      {
        target: at('cmp-installed'),
        title: 'Installed machines',
        body: 'Six states have reported how many CPAP machines are installed. Each row compares that count with the three estimates for the state.',
      },
      {
        target: at('cmp-states'),
        title: 'All states compared',
        body: 'This compares every state’s current demand with its need. Choose which estimate of need to use. States with current demand far below need are marked under-served.',
      },
      {
        target: at('cmp-read'),
        title: 'How to read it',
        body: 'These notes explain what the comparison can and cannot tell you.',
      },
    ],
  },
  {
    key: 'fc',
    label: 'Forecast of public demand',
    desc: 'Machines in place and in use each year, the three scenarios, and what drives them.',
    place: FC,
    steps: [
      {
        title: 'The forecast',
        body: 'The forecast looks 5 to 12 years ahead. Each year it counts the CPAP machines in place and the machines actually in use. It compares the machines in use with the public need from the facility-based approach.',
      },
      {
        target: at('fc-how'),
        title: 'How the forecast works',
        body: 'Seven factors move the forecast: SNCU growth, CPAP at newborn stabilisation units (NBSUs), CPAP at mother-newborn care units (MNCUs), CPAP in ambulances, and the share of machines in use. This card shows today’s level of each one and the range the tool tries.',
      },
      {
        target: '[data-tour="fc-years"]',
        title: 'Years to project',
        body: 'Choose how many years to look ahead. Every number on the page is worked out again for the new end year.',
      },
      {
        target: at('fc-inputs'),
        title: 'Your combination',
        body: 'Set your own value for each factor with these sliders. Your result is drawn as the “Your combination” line on the chart and shown on the last card.',
      },
      {
        target: at('fc-chart'),
        title: 'Every combination',
        body: 'The tool tries 253,440 combinations of the factors. The faint lines show some of them, and the shaded band holds the middle 8 in 10 results. The dashed line is the public need.',
      },
      {
        target: at('fc-scenarios'),
        title: 'The three scenarios',
        body: 'Baseline keeps to today’s path. Moderate expansion closes half the gap to the need. Accelerated reaches the need by the end year. Click a card to see what makes up its machines.',
      },
      {
        target: at('fc-factors'),
        title: 'What matters most',
        body: 'This chart shows which factors change the result the most. The Methodology card below explains how the combinations and the scenarios are built.',
      },
    ],
  },
  {
    key: 'pvt-homes',
    label: 'Private sector: maternity homes',
    desc: 'How many machines private maternity homes need, by size group.',
    place: PVT_HOMES,
    steps: [
      {
        title: 'Private maternity homes',
        body: 'The private sector is estimated apart from the public sector, because the government does not buy machines for private facilities. This approach counts private maternity homes and the machines each one should have.',
      },
      {
        target: '[data-tour="pvt-switch"]',
        title: 'Two ways to estimate',
        body: 'This tour covers Maternity homes. The other approach, RDS prevalence (private), has its own tour.',
      },
      {
        target: at('homes-inputs'),
        title: 'Check the inputs',
        body: 'Homes are counted in three size groups, each with a number of CPAP machines per home. There is no official count of private maternity homes, so these numbers are assumptions. Change them to match what you know.',
      },
      {
        target: at('homes-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed. This approach adds no planning buffer.',
      },
      {
        target: at('homes-groups'),
        title: 'By size group',
        body: 'The bars and the table show how many machines each size group needs.',
      },
      {
        target: at('homes-limits'),
        title: 'Limits',
        body: 'This card lists the main limits of this approach. The result is kept apart from the public estimates.',
      },
    ],
  },
  {
    key: 'pvt-rds',
    label: 'Private sector: RDS prevalence',
    desc: 'The RDS-based approach applied to births in private facilities.',
    place: PVT_RDS,
    steps: [
      {
        title: 'RDS-based private need',
        body: 'This approach uses the same steps as the public RDS-based approach, but it counts births in private facilities. These are about 35% of all facility births in India.',
      },
      {
        target: '[data-tour="pvt-switch"]',
        title: 'Two ways to estimate',
        body: 'This tour covers RDS prevalence (private). The other approach, Maternity homes, has its own tour.',
      },
      {
        target: at('rds-inputs'),
        title: 'Check the inputs',
        body: 'The settings are the same as in the public approach. The first section sets each state’s private share of facility births.',
      },
      {
        target: at('rds-how'),
        title: 'How it is worked out',
        body: 'Click this heading to follow the calculation with real numbers, for India or for one state.',
      },
      {
        target: at('rds-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed in private facilities, including a 25% planning buffer.',
      },
      {
        target: at('rds-states'),
        title: 'State by state',
        body: 'See each state’s private need as a map, a chart or a table.',
      },
      {
        target: at('rds-limits'),
        title: 'Limits',
        body: 'This card lists the main limits of this approach.',
      },
    ],
  },
]

export const TRACK_GROUPS: { label: string; keys: TrackKey[] }[] = [
  { label: 'Start', keys: ['around'] },
  { label: 'Public sector: demand today', keys: ['bu', 'td-facility', 'td-rds', 'cmp'] },
  { label: 'Public sector: forecast', keys: ['fc'] },
  { label: 'Private sector', keys: ['pvt-homes', 'pvt-rds'] },
]

export const trackOf = (key: TrackKey) => TRACKS.find((t) => t.key === key)!
