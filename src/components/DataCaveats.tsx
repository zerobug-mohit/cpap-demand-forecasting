/** Important data-vintage caveats shown beside the epidemiological source citations. */
export default function DataCaveats() {
  return (
    <p className="source-note data-caveat">
      <span className="src-prefix">Notes:</span> NFHS-6 (2023-24) fact sheets do not publish low birth weight, so
      LBW uses the latest that does — NFHS-5 (2019-21). Manipur is not covered by NFHS-6, so its institutional-delivery
      rate stays on NFHS-5. SRS publishes neonatal mortality only for the 22 larger states/UTs; the 14 not covered —
      Arunachal Pradesh, Goa, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Andaman &amp; Nicobar Islands,
      Chandigarh, Dadra &amp; Nagar Haveli and Daman &amp; Diu, Ladakh, Lakshadweep and Puducherry — show NA and default
      to neutral (LBW-only) in the risk index.
    </p>
  )
}
