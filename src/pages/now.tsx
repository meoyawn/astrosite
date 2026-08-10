import { SiteShell } from "../layouts/site-shell.tsx"

const Now = () => (
  <SiteShell
    contentClass={undefined}
    currentPath={undefined}
    description="What Adel Nizamutdinov is focused on now in Kazan, Tatarstan, Russia."
    lang="en"
    navClass={undefined}
    title="Now | Adel Nizamutdinov"
  >
    <h1 class="mb-0">Now</h1>
    <p class="not-prose mt-2 mb-8 text-sm leading-6 font-medium text-zinc-500 tabular-nums">
      <time datetime="2026-08-10">10 Aug 2026</time>
    </p>
    <p>I’m in Kazan, Tatarstan, Russia.</p>
    <p>
      I’m building <a href="https://listenbox.app">Listenbox</a>.
    </p>
  </SiteShell>
)

export default Now
