import type { JSX } from "solid-js"
import { ssr } from "solid-js/web"
import travelIsland from "../app/travels/travel-island.tsx?island"
import { SiteShell } from "../layouts/site-shell.tsx"

const isSolidSsrNode = (value: unknown): value is JSX.Element =>
  typeof value === "object" &&
  value !== null &&
  "t" in value &&
  typeof value.t === "string"

const DesignContract = (): JSX.Element => {
  const contract = ssr(`<!--
THESIS: A life in motion reads fastest when time and geography share one uninterrupted field.
OWN-WORLD: An editorial white canvas, a pale interactive globe, quiet blue routes, and one precise travel focus.
STORY: See the full journey first; scrub time or select a place; inspect every stay there without leaving the globe.
FIRST VIEWPORT: Travels title and current place at left, oversized interactive globe at right, complete year rail across the bottom.
FORM: d4575df7 — globe aperture translated into a spatial timeline with no decorative cards or editorial filler.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`)

  if (!isSolidSsrNode(contract)) {
    throw new TypeError("Design contract could not be serialized")
  }

  return contract
}

const TravelPage = (): JSX.Element => (
  <SiteShell
    bodyStart={<DesignContract />}
    contentClass="max-w-none p-0"
    currentPath={undefined}
    description="An interactive globe and timeline of travels from 2013 to 2026."
    lang="en"
    navClass="w-full max-w-none"
    title="Travels — Adel"
  >
    <div id="travel-island">
      <section data-travel-shell aria-label="Travel map">
        <p data-travel-globe-status>Loading...</p>
      </section>
    </div>
    <noscript>This map needs JavaScript for globe and timeline interaction.</noscript>
    <script type="module" src={travelIsland} />
  </SiteShell>
)

export default TravelPage
