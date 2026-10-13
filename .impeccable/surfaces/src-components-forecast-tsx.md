---
version: 1
slug: "src-components-forecast-tsx"
primary_target: "src/components/Forecast.tsx"
related_targets: ["src/App.tsx","src/styles/designs.css"]
---

# Surface brief — whole tool (all tabs), design-variation round

Scope: every tab of the tool, restyled through `data-design` on <html> (src/styles/designs.css, switcher in the masthead). Mode: Operate. Audience: WJCF staff presenting live to government and Global Fund officials, and programme officers exploring alone on laptops. Constraints: all tabs, features, numbers and copy stay as they are; most designs stay navy/teal, one or two explore other palettes; plain language; no decorative filler (user rejected coloured card top-borders as "AI slop").

Added for every design: a light-bulb explainer on each part (src/components/Explain.tsx, text in src/data/explainers.ts).

Unresolved: the user picks one design; then DESIGN.md is written from it and the others are removed.

## Direction contract
THESIS: Show the same working tool in six complete visual languages drawn from the readers' own documents and screens, so the user chooses a world, not a colour swap. Refuses the generic SaaS dashboard (white cards, soft shadows, icon tiles).
OWN-WORLD: Report — open white pages, teal section bands, Libre Franklin + Source Serif 4. Bulletin — navy ink, booktab rules, Noto Serif titles. Public service — UX4G/GOV.UK: big type, 1px borders, navy header, yellow-black focus. Blueprint — navy sheet, drafting grid, Barlow Condensed caps. Swiss grid — black rules, huge tight figures, one yellow marker. Ward monitor — dark flat panels, B612 + B612 Mono readouts, red dashed alarm-limit need line.
STORY: An official sees how many CPAP devices are needed, what drives it, and can ask "what is this?" anywhere via the bulb.
FIRST VIEWPORT: masthead with the WJCF identity and the Design switcher; nav; the tab's lead card. Forecast: intro with Years slider, then step 1 with "Your combination" beside the KPIs and chart.
FORM: assigned direction = Report (grounded list position 3, seed key 38081f3c); pick = Bulletin; four more grounded or research-backed (Dribbble study) worlds built alongside at the user's request.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
