import { For } from "solid-js"
import timepieceIsland from "./home-timepiece-island.ts?island"

export const HomeTimepiece = () => (
  <div
    id="home-timepiece"
    aria-hidden="true"
    data-running="false"
    class="absolute bottom-[calc(100%+0.5rem)] left-1/2 h-14 w-18 -translate-x-1/2 text-zinc-900"
  >
    <svg
      aria-hidden="true"
      class="size-full overflow-visible"
      viewBox="0 0 72 56"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <g transform="translate(26 32)">
        <g data-timepiece-balance transform="rotate(-40)">
          <circle r="15.5" stroke-width="0.85" />
          <path
            d="M-10.96-10.96A15.5 15.5 0 0 1 10.96-10.96M-10.96 10.96A15.5 15.5 0 0 0 10.96 10.96"
            stroke-width="2.25"
          />
        </g>
        <path
          d="M0 0C-3 0-3-4 0-4C6-4 6 5 0 5C-9 5-9-8 0-8H3"
          class="stroke-zinc-400"
          stroke-width="0.65"
        />
        <circle r="1.5" fill="currentColor" stroke="none" />
      </g>
      <g transform="translate(48 20)">
        <g data-timepiece-driver stroke-width="0.85">
          <circle r="8.5" />
          <For each={Array.from({ length: 12 }, (_, index) => index * 30)}>
            {angle => <path d="M-1-8.5L0-11L1.8-10.5" transform={`rotate(${angle})`} />}
          </For>
          <path d="M0-8.5V0L7.4 4.25M0 0L-7.4 4.25" />
        </g>
        <circle r="1.25" fill="currentColor" stroke="none" />
      </g>
    </svg>
    <script type="module" src={timepieceIsland} />
  </div>
)
