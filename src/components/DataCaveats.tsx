import { ExplainHere } from './Explain'

/** Important data-vintage caveats shown beside the epidemiological source citations. */
export default function DataCaveats() {
  return (
    <>
      <ExplainHere id="td-rds-data-notes" />
      <p className="source-note data-caveat">
        <span className="src-prefix">Notes on the data:</span> The NFHS-6 (2023-24) fact sheets do not report low birth
        weight, so we use the most recent survey that does, NFHS-5 (2019-21). Manipur is not covered by NFHS-6, so its
        facility-delivery rate still comes from NFHS-5. The SRS reports newborn death rates for only the 22 larger
        states and union territories. The other 14 show “NA”, and for them the split uses low birth weight only. They
        are Arunachal Pradesh, Goa, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Andaman &amp; Nicobar
        Islands, Chandigarh, Dadra &amp; Nagar Haveli and Daman &amp; Diu, Ladakh, Lakshadweep and Puducherry.
      </p>
    </>
  )
}
