import type { JSX } from "solid-js"
import type { Org as OrgData } from "./data/cv.types.ts"
import images from "./ogimages.json"

export interface OrgProps {
  children: JSX.Element
  org: OrgData
}

const isImageUrl = (value: string): value is keyof typeof images =>
  Object.hasOwn(images, value)

export const Org = (props: OrgProps) => (
  <div class="grid break-inside-avoid-page grid-cols-[3rem_minmax(0,1fr)] gap-x-4 py-3 first:pt-0 print:grid-cols-[2rem_minmax(0,1fr)] print:gap-x-2.5 print:py-2.5">
    <a
      class="not-prose block shrink-0"
      target="_blank"
      rel="noreferrer"
      href={props.org.url}
    >
      <img
        loading="eager"
        width="48"
        height="48"
        class="size-12 rounded-xl object-cover print:size-8 print:rounded-sm"
        src={
          props.org.imgURL ??
          (isImageUrl(props.org.url) ? images[props.org.url] : undefined)
        }
        alt={props.org.name}
      />
    </a>
    <div class="min-w-0">{props.children}</div>
  </div>
)
