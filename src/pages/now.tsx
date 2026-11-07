import { SiteShell } from "../layouts/site-shell.tsx"
import { localizedRoute, routes } from "../routes.ts"

const Now = () => (
  <SiteShell
    canonicalPath={routes.now}
    contentClass={undefined}
    currentPath={undefined}
    description="What Adel Nizamutdinov is focused on now: building Listenbox and living in Kazan, Tatarstan, Russia. A brief update on his current work and location."
    lang="en"
    navClass={undefined}
    openGraphType="website"
    title="Now | Adel Nizamutdinov"
  >
    <h1 class="mb-0">Now</h1>
    <p class="not-prose mt-2 mb-8 text-sm leading-6 font-medium text-zinc-500 tabular-nums">
      <time datetime="2026-08-10">10 Aug 2026</time>
    </p>
    <p>
      I’m in <a href={routes.travel}>Kazan, Tatarstan, Russia</a>.
    </p>
    <p>
      I’m building <a href="https://listenbox.app">Listenbox</a>.
      {" "}It’s a podcast hosting service that I build and run, from product
      development to the support and maintenance that keep it working.
    </p>
    <p>
      I write about software engineering, APIs, developer tools, and AI agents.
      You can find my recent notes on the <a href={routes.home}>home page</a>.
    </p>
    <p>
      For more background, read my <a href={localizedRoute("en", "cv")}>CV</a>
      {" "}or <a href={localizedRoute("en", "workTogether")}>get in touch</a>.
      For another view of my hometown, explore my
      {" "}<a href="https://kazan.adelnz.com/">3D model of Kazan</a>.
    </p>
  </SiteShell>
)

export default Now
