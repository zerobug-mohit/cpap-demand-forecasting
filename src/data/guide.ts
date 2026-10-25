// The user guides: the steps of each page, and the guided tours (two-panel version).
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
  /** On a two-panel page, the input step to open first (with the page's scope). */
  scope?: string
  open?: number
}

export interface Track {
  key: TrackKey
  label: string
  desc: string
  place: Place
  steps: TourStep[]
}

const at = (id: string) => `[data-step="${id}"]`
// Two-panel pages: an input step on the left, and the parts of the Output column.
const inStep = (scope: string, n: number) => `[data-field-scope="${scope}"] [data-io-step="${n}"]`
const IN = '[data-tour="io-inputs"]'
const OUT = '[data-tour="io-output"]'
const DRILL = '[data-tour="io-drill"]'
const APPROACH = '[data-tour="io-approach"]'

const BU: Place = { section: 'estimation', sub: 'bu' }
const TD_FAC: Place = { section: 'estimation', sub: 'td', td: 'facility' }
const TD_RDS: Place = { section: 'estimation', sub: 'td', td: 'rds' }
const CMP: Place = { section: 'estimation', sub: 'cmp' }
const FC: Place = { section: 'forecasting', sub: 'fc' }
const PVT_HOMES: Place = { section: 'private', sub: 'pvt', pvt: 'homes' }
const PVT_RDS: Place = { section: 'private', sub: 'pvt', pvt: 'rds' }

const DRILL_BODY = 'This breakdown shows each step of the calculation with the real numbers. A yellow value is an input you can change: click it, and the tool takes you to it on the left.'

export const TRACKS: Track[] = [
  {
    key: 'around',
    label: 'Getting around the tool',
    desc: 'The main tabs, the two columns on each page, the yellow values, the bulbs and the tours.',
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
        target: IN,
        place: BU,
        title: 'Inputs on the left',
        body: 'Each approach has two columns. On the left are the inputs, in numbered steps. Open one step at a time, or use Next at the bottom of a step. Every input starts at a yellow preset value.',
      },
      {
        target: OUT,
        place: BU,
        title: 'Results on the right',
        body: 'On the right are the results. They update as soon as you change an input on the left.',
      },
      {
        target: DRILL,
        place: BU,
        title: 'Yellow values in each calculation',
        body: DRILL_BODY,
      },
      {
        target: '[data-tour="guides-switch"]',
        place: BU,
        title: 'Show or hide the guides',
        body: 'Turn Guides off to hide the bulbs and the “What to do” notes, for example when you present to a room. Turn them on again at any time.',
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
        target: inStep('bu', 1), scope: 'bu', open: 1,
        title: 'Check the SNCU norms',
        body: 'The inputs are in numbered steps on the left. Step 1 holds the SNCU norms: the presets give each SNCU 16 beds on average, and a CPAP machine for 30% of SNCU beds. Yellow values are presets. A value you change turns green.',
      },
      {
        target: inStep('bu', 2), scope: 'bu', open: 2,
        title: 'The planning buffer',
        body: 'Step 2 sets the planning buffer, 25% by default, for busy periods, breakdowns and the time to order replacements. Reset all brings back every preset.',
      },
      {
        target: at('o-bu-result'),
        title: 'The result',
        body: 'The results are on the right and update as you type. The first box is the answer: the CPAP machines that today’s SNCUs need, including a 25% planning buffer.',
      },
      {
        target: DRILL,
        title: 'How the number is worked out',
        body: `${DRILL_BODY} Use Show for to follow the calculation for one state.`,
      },
      {
        target: at('o-bu-states'),
        title: 'State by state',
        body: 'See the result for every state as a map, a chart or a table. Six states have reported how many machines are installed, and the chart and the table compare these counts with the estimate.',
      },
      {
        title: 'Try it yourself',
        body: 'Click the yellow “16 beds” in the breakdown, change it on the left, and watch every number update. Reset all brings back the presets. Your changes stay until you reload the page.',
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
        target: APPROACH,
        title: 'Two ways to estimate need',
        body: 'This tab has two approaches. This tour covers Deliveries × FBNC norms. The other approach, RDS prevalence, has its own tour.',
      },
      {
        target: inStep('fac', 1), scope: 'fac', open: 1,
        title: 'The FBNC norm',
        body: 'Step 1 sets the norm for each level of facility: 4 SNCU beds per 1,000 deliveries, with a CPAP machine for 30% of those beds. That gives 1.2 machines per 1,000 deliveries. Untick a level to leave it out.',
      },
      {
        target: inStep('fac', 2), scope: 'fac', open: 2,
        title: 'Facilities and workload',
        body: 'Step 2 sets how many facilities each level has, and how many of them do many or few deliveries. Step 3 sets the average deliveries for each group, and step 4 the planning buffer.',
      },
      {
        target: at('o-fac-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed, including a 25% planning buffer. The other boxes show the deliveries and the facilities counted.',
      },
      {
        target: DRILL,
        title: 'How the number is worked out',
        body: `Pick a facility level to see its calculation: the facilities in each workload group, their deliveries, and the machines. Every sub-district hospital and community health centre gets at least one machine. ${DRILL_BODY}`,
      },
      {
        target: at('o-fac-states'),
        title: 'State by state',
        body: 'The same calculation for each state, based on its own count of each type of facility. Use the map or the table.',
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
        target: APPROACH,
        title: 'Two ways to estimate need',
        body: 'This tour covers RDS prevalence. The other approach, Deliveries × FBNC norms, has its own tour.',
      },
      {
        target: inStep('rds', 1), scope: 'rds', open: 1,
        title: 'Newborns who need CPAP',
        body: 'Births in public facilities are counted with each state’s own public share. Step 1 sets how many newborns per 1,000 facility births are likely to need CPAP: the presets count 25 RDS cases per 1,000 births, doubled to cover other breathing problems treated with CPAP.',
      },
      {
        target: inStep('rds', 2), scope: 'rds', open: 2,
        title: 'From newborns to machines',
        body: 'Step 2 turns newborns into machines: each spends 5 days on CPAP, the days are divided by 365, and a 25% buffer is added. Step 3 sets how the total is shared among states.',
      },
      {
        target: at('o-rds-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed. The others show the births counted and the newborns likely to need CPAP.',
      },
      {
        target: DRILL,
        title: 'How the number is worked out',
        body: `${DRILL_BODY} Pick a state in Show for to see how its share is worked out from low birth weight and newborn deaths.`,
      },
      {
        target: at('o-rds-states'),
        title: 'State by state',
        body: 'See each state’s share of the national need as a map, a chart or a table. Treat each figure as a fair share, not as a count made in that state.',
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
        target: inStep('cmp', 1), scope: 'cmp', open: 1,
        title: 'Choose an area',
        body: 'Pick India or one state. Every result on the right is then shown for that area.',
      },
      {
        target: inStep('cmp', 3), scope: 'cmp', open: 3,
        title: 'Where the numbers come from',
        body: 'This page has no inputs of its own. Each figure comes from an approach on another tab. Use “Change its inputs” to open that approach.',
      },
      {
        target: at('cmp-area'),
        title: 'Demand by approach',
        body: 'The bar places current demand, the two estimates of need and, where reported, the machines installed on one line. The gap between current demand and need is what the public system would still have to add.',
      },
      {
        target: at('cmp-installed'),
        title: 'Installed machines',
        body: 'Six states have reported how many CPAP machines are installed. Each row compares that count with the three estimates for the state.',
      },
      {
        target: at('cmp-states'),
        title: 'All states compared',
        body: 'This compares every state’s current demand with its need. Choose which estimate of need to use in step 2 on the left. States with current demand far below need are marked under-served.',
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
        target: inStep('fc', 1), scope: 'fc', open: 1,
        title: 'Years to project',
        body: 'Step 1 sets how many years to look ahead. Every number on the right is worked out again for the new end year.',
      },
      {
        target: inStep('fc', 3), scope: 'fc', open: 3,
        title: 'Your combination',
        body: 'Steps 2 to 4 set your own value for each factor: SNCU growth, new CPAP at NBSUs, at mother-newborn care units (MNCUs) and in ambulances, and the share of machines in use.',
      },
      {
        target: at('o-fc-chart'),
        title: 'Every combination',
        body: 'The tool tries 253,440 combinations of the factors. The faint lines show some of them, and the shaded band holds the middle 8 in 10 results. The dashed line is the public need.',
      },
      {
        target: at('fc-scenarios'),
        title: 'The three scenarios',
        body: 'Baseline keeps to today’s path. Moderate expansion closes half the gap to the need. Accelerated reaches the need by the end year. Click a card to follow that line.',
      },
      {
        target: DRILL,
        title: 'How the number is worked out',
        body: 'This breakdown follows the selected line to the end year: SNCUs, then each kind of CPAP, then the share in use. For your combination, click a yellow value to change it on the left.',
      },
      {
        target: at('o-fc-factors'),
        title: 'What matters most',
        body: 'This chart shows which factors change the result the most. The notes below it explain how the forecast and the scenarios are built.',
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
        target: APPROACH,
        title: 'Two ways to estimate',
        body: 'This tour covers Maternity homes. The other approach, RDS prevalence (private), has its own tour.',
      },
      {
        target: inStep('homes', 1), scope: 'homes', open: 1,
        title: 'Homes by size group',
        body: 'Homes are counted in three size groups, each with a number of CPAP machines per home. There is no official count of private maternity homes, so these numbers are assumptions. Change them to match what you know.',
      },
      {
        target: at('o-homes-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed. This approach adds no planning buffer.',
      },
      {
        target: DRILL,
        title: 'How the number is worked out',
        body: DRILL_BODY,
      },
      {
        target: at('o-homes-groups'),
        title: 'By size group',
        body: 'The bars compare how many machines each size group needs. The notes below list the main limits of this approach.',
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
        target: APPROACH,
        title: 'Two ways to estimate',
        body: 'This tour covers RDS prevalence (private). The other approach, Maternity homes, has its own tour.',
      },
      {
        target: inStep('prds', 1), scope: 'prds', open: 1,
        title: 'The inputs',
        body: 'Births in private facilities are counted with each state’s own private share. The steps on the left work as in the public approach: newborns who need CPAP, from newborns to machines, and sharing the total among states.',
      },
      {
        target: at('o-prds-result'),
        title: 'The result',
        body: 'The first box is the total number of machines needed in private facilities, including a 25% planning buffer.',
      },
      {
        target: DRILL,
        title: 'How the number is worked out',
        body: `${DRILL_BODY} Pick a state in Show for to follow its share.`,
      },
      {
        target: at('o-prds-states'),
        title: 'State by state',
        body: 'See each state’s private need as a map, a chart or a table.',
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
