import { For, Show } from "solid-js"
import type { Locale } from "../i18n.ts"
import { md2html } from "../markdown.ts"
import { fmtDate, fmtExpTime } from "./cv.ts"
import type { CV } from "./data/cv.types.ts"
import type { CVPageCopy } from "./cvPageCopy.ts"
import { IconLink } from "./icon-link.tsx"
import { Org } from "./org.tsx"
import { Products } from "./products.tsx"
import { SiteShell } from "../../layouts/site-shell.tsx"

export interface CvPageProps {
  copy: CVPageCopy
  cv: CV
  locale: Locale
}

const orgHeaderClass = "not-prose mb-2 print:mb-1.5"
const orgTitleClass =
  "m-0 text-lg font-bold leading-tight text-zinc-950 print:text-[13px]"
const orgMetaClass =
  "m-0 mt-0.5 text-base leading-snug text-zinc-950 print:text-[12px]"
const orgMutedClass = "m-0 text-base leading-snug text-date print:text-[12px]"
const orgLinkClass = "text-(--tw-prose-links) hover-underline"
const orgMetaLinkClass = `${orgLinkClass} font-medium`

export const CvPage = (props: CvPageProps) => (
  <SiteShell
    contentClass="mx-0 prose max-w-none px-0 pb-6 prose-sky sm:mx-12 sm:pb-12 md:mx-16 md:pb-16 print:m-0 print:text-[12px] print:leading-[1.45] prose-h1:print:mb-1.5 prose-h1:print:text-[24px] prose-h3:print:mb-1.5 prose-h3:print:mt-4 prose-h3:print:text-[13.5px] prose-p:my-2 prose-p:print:my-1.5 prose-ul:my-1 prose-ul:print:my-1 prose-li:print:my-0.5"
    currentPath="cv"
    description="Personal website"
    lang={props.locale}
    navClass="print:hidden"
    title={props.copy.cvTitle}
  >
    <section>
      <h1>{props.cv.head.name}</h1>
      <h3>{props.cv.head.title}</h3>
      <p class="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 print:grid-cols-2 print:gap-x-5 print:gap-y-1">
        <IconLink
          asset="email"
          href={`mailto:${props.cv.head.email}`}
          alt={props.copy.iconAlt.email}
        />
        <IconLink
          asset="linkedin"
          href={props.cv.head.linkedin}
          alt={props.copy.iconAlt.linkedin}
        />
        <IconLink
          asset="link"
          href={props.cv.head.url}
          alt={props.copy.iconAlt.website}
        />
        <IconLink
          asset="github"
          href={props.cv.head.github}
          alt={props.copy.iconAlt.github}
        />
      </p>
    </section>

    <section>
      <h3>{props.copy.summary}</h3>
      <div innerHTML={md2html(props.cv.summaryMD)} />
    </section>

    <section>
      <h3>{props.copy.skills}</h3>
      <ul class="print:columns-2 print:gap-x-6">
        <For each={props.cv.skills}>{skill => <li>{skill}</li>}</For>
      </ul>
    </section>

    <section>
      <h3>{props.copy.experience}</h3>
      <For each={props.cv.experience}>
        {experience => (
          <Org org={experience.org}>
            <div class={orgHeaderClass}>
              <Show when={experience.title}>
                {title => <h4 class={orgTitleClass}>{title()}</h4>}
              </Show>
              <p class={experience.title === undefined ? orgTitleClass : orgMetaClass}>
                <a
                  href={experience.org.url}
                  target="_blank"
                  rel="noreferrer"
                  class={orgMetaLinkClass}
                >
                  {experience.org.name}
                </a>
              </p>
              <p class={orgMutedClass}>
                {fmtExpTime({ ...experience, locale: props.locale })}
              </p>
              <p class={orgMutedClass}>{experience.location}</p>
            </div>
            <div innerHTML={md2html(experience.summaryMD)} />
            <Products
              products={experience.products}
              intro={props.copy.workedOn}
            />
          </Org>
        )}
      </For>
    </section>

    <section>
      <h3>{props.copy.education}</h3>
      <For each={props.cv.education}>
        {education => (
          <Org org={education.org}>
            <div class={orgHeaderClass}>
              <h4 class={orgTitleClass}>
                <a
                  href={education.org.url}
                  target="_blank"
                  rel="noreferrer"
                  class={orgLinkClass}
                >
                  {education.org.name}
                </a>
              </h4>
              <p class={orgMutedClass}>
                {fmtExpTime({
                  ...education,
                  duration: false,
                  locale: props.locale,
                })}
              </p>
            </div>
            <div innerHTML={md2html(education.degreeMD)} />
            <Products
              products={education.products}
              intro={props.copy.workedOn}
            />
          </Org>
        )}
      </For>
    </section>

    <section>
      <h3>{props.copy.awards}</h3>
      <For each={props.cv.awards}>
        {award => (
          <Org org={award.org}>
            <div class={orgHeaderClass}>
              <h4 class={orgTitleClass}>
                <a
                  href={award.url}
                  target="_blank"
                  rel="noreferrer"
                  class={orgLinkClass}
                >
                  {award.title}
                </a>
              </h4>
              <p class={orgMetaClass}>
                <a
                  href={award.org.url}
                  target="_blank"
                  rel="noreferrer"
                  class={orgMetaLinkClass}
                >
                  {award.org.name}
                </a>
              </p>
              <p class={orgMutedClass}>{fmtDate(award.date, props.locale)}</p>
            </div>
          </Org>
        )}
      </For>
    </section>
  </SiteShell>
)
