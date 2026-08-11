# CPAP Demand Estimator — India (Method 1, bottom-up)

Interactive, client-side estimate of the public-sector neonatal **CPAP device requirement** across India,
built from the newborn-care facility network and **FBNC 2025** equipment norms. Design language adapted from
[OxyCost](https://zerobug-mohit.github.io/OxyCost/).

## What it does

- **As-is lens:** applies the CPAP-per-bed norm to the SNCU beds that exist today.
- **Normative lens:** applies it to the beds a fully built-out network would have (births ÷ 1,000 × norm).
- Adjustable norms (CPAP/bed, avg beds/SNCU, normative beds/1,000 births) recalculate everything live.
- State-wise table (36 states/UTs), top-15 chart, national KPIs, coverage and build-out gap.

## Stack

React 18 · TypeScript · Vite 5 · Recharts. Pure calculation engine in `src/engine/` (no React), UI in
`src/components/`, data in `src/data/states.ts`.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Data & caveats

- Facility unit counts: MoHFW/DoHFW Annual Report 2024-25 (as on Oct 2024). SNCU column includes NICUs.
- Live births: Population 2026 (NCP projection) × SRS 2021 CBR.
- Per-state SNCU **beds** are unpublished → derived from units × average beds (the biggest assumption).
- Installed CPAP counts are not public → the procurement gap needs a facility device survey (MP first).
