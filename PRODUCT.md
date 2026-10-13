# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **WJCF staff presenting live.** They drive the tool on a screen or projector in meetings with government (MoHFW / NHM, state programme officers) and Global Fund stakeholders, answering questions by changing assumptions on the spot.
- **Programme officers and officials exploring on their own.** National and state officers open the link afterwards, mostly on laptops, to check numbers for their state and test assumptions.
- Both groups are public-health and government readers, not modellers.

## Product Purpose

Estimates how many newborn CPAP (breathing-support) devices India's public sector needs today, and forecasts how many devices will be in place and in use over the next 5–12 years against the public epidemiological need. It exists to inform national and state planning and procurement. Success is an official understanding, in one sitting, how big the need is, what drives it, and what it would take to meet it.

## Positioning

It puts several independent ways of estimating demand side by side (current infrastructure under government guidelines; epidemiological need from RDS prevalence and from facility deliveries × FBNC norms; the private sector), state by state, and then simulates 84,480 combinations of growth, policy and utilisation factors to produce three scenarios. Every assumption is visible and editable, and every number is calculated in the browser.

## Operating Context

- Two sections: **CPAP Demand Estimation** (Guidelines-based current demand · Epidemiological Need · Private sector Demand · Compare estimates) and **CPAP Demand Forecasting** (one Forecast tab: try every combination → three scenarios).
- Hosted as a static site on GitHub Pages (zerobug-mohit/cpap-demand-forecasting); all calculation runs client-side.
- Used both in meeting rooms (shared screen, projector, people reading from a distance) and one-to-one on laptops.

## Capabilities and Constraints

- Stack: React 18, Vite, TypeScript, Recharts. No backend.
- All tabs, charts, controls, calculations and numbers stay as they are. Design work changes the look and adds explainers; it does not remove or re-scope features.
- Key terms: SNCU, NBSU, MNCU, FBNC, RDS, DH / SDH / CHC, devices in place, devices in use, utilisation, public need (ceiling). Each is kept but explained in plain words.
- Data sources are cited in `src/data/sources.ts` (RHS 2022-23, HDI 2022-23, NFHS, FBNC 2025 guidelines, MoHFW replies, peer-reviewed studies).

## Brand Commitments

- Identity: "WJCF · Neonatal CPAP · India" and the title "CPAP Demand Estimation & Forecasting" are kept in every design.
- Colour: navy (#123a5e) and teal (#0e7e92) are the brand colours. Most design variations stay in this family; one or two may explore other palettes for comparison (confirmed 2026-10-13).
- Voice: simple, clear English in full sentences; no jargon or clever phrasing.
- No decorative filler: no coloured accent stripes on cards, gradients, gimmick icon tiles or other template flourishes.

## Evidence on Hand

- Real data files in `src/data/` (state facility counts, births, SNCU/NBSU counts, installed devices for six states, India state boundaries, cited sources).
- No testimonials, customers, endorsements or benchmarks exist; none may be invented.

## Product Principles

1. Clear to a non-technical official first: plain words, and every number says what it is.
2. Show the working: every assumption is visible, editable and explained.
3. Be honest about uncertainty and feasibility, including when a target needs values beyond what is realistic.
4. Work equally well when presented to a room and when explored alone.

## Accessibility & Inclusion

Readable from a distance on projectors as well as on laptops. Colour is never the only way to tell chart series apart. Text meets WCAG AA contrast.
