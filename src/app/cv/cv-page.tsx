import { For, Show } from "solid-js"
import type { Locale } from "../i18n.ts"
import { md2html } from "../markdown.ts"
import { fmtDate, fmtExpTime } from "./cv.ts"
import type { CV } from "./data/cv.types.ts"
import type { CVPageCopy } from "./cvPageCopy.ts"
import { IconLink } from "./icon-link.tsx"
import { Org } from "./org.tsx"
import { Products } from "./products.tsx"
import { readingContentClass, SiteShell } from "../../layouts/site-shell.tsx"
import { localizedRoute } from "../../routes.ts"

export interface CvPageProps {
  copy: CVPageCopy
  cv: CV
  locale: Locale
}

/**
 * Two columns from `lg`: the work record on the left, reference facts on the
 * right. Print stays one column in source order so PDF text extractors keep
 * every phrase in reading order.
 */
const columnsClass =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-20 print:block"
const wideClass = "lg:max-w-6xl lg:px-10"

const orgHeaderClass = "not-prose mb-3 print:mb-1.5"
const orgHeadlineClass =
  "flex flex-wrap items-baseline justify-between gap-x-6 print:block"
const orgTitleClass =
  "m-0 text-[1.25em] leading-[1.6] font-semibold tracking-[-0.02em] text-balance text-zinc-900 print:text-[13px] print:font-bold print:leading-tight"
const orgMetaClass =
  "m-0 mt-0.5 text-base leading-reading text-zinc-900 print:text-[12px] print:leading-snug"
const orgMutedClass =
  "m-0 text-sm leading-5 text-date tabular-nums print:text-[12px] print:leading-snug print:text-zinc-600"
const orgLinkClass = "text-link hover-underline"
const orgMetaLinkClass = `${orgLinkClass} font-semibold`

const splitSkill = (skill: string): { label?: string; items: string } => {
  const separator = " — "
  const index = skill.indexOf(separator)
  return index < 0
    ? { items: skill }
    : {
        label: skill.slice(0, index),
        items: skill.slice(index + separator.length),
      }
}

export const CvPage = (props: CvPageProps) => (
  <SiteShell
    canonicalPath={localizedRoute(props.locale, "cv")}
    contentClass={`${readingContentClass} ${wideClass} lg:pt-14 print:font-print print:[font-variant-ligatures:none] [--color-link:var(--color-cv-link)] print:m-0 print:max-w-none print:p-0 print:text-[12px] print:leading-[1.35] prose-h2:print:break-after-avoid-page prose-h2:print:mt-3 prose-h2:print:mb-1.5 prose-h2:print:text-[13.5px] prose-h2:print:leading-snug prose-p:print:my-1 prose-ul:print:my-1 prose-li:marker:text-zinc-500 prose-li:print:my-0`}
    currentPath="cv"
    description={props.copy.description}
    lang={props.locale}
    navClass={`print:hidden ${wideClass}`}
    openGraphType="website"
    title={props.copy.cvTitle}
  >
    <header
      class={`not-prose mb-12 border-b border-zinc-200 pb-10 lg:items-end print:mb-3 print:border-0 print:pb-0 ${columnsClass}`}
    >
      <div>
        <h1 class="m-0 text-reading-title font-bold tracking-tight text-balance text-zinc-900 print:text-[24px] print:leading-tight">
          {props.cv.head.name}
        </h1>
        <p class="m-0 mt-3 text-xl leading-7 font-normal text-zinc-800 print:mt-1 print:text-[13.5px] print:leading-snug">
          {props.cv.head.title}
        </p>
        <p class="m-0 mt-1.5 text-sm leading-6 text-zinc-600 print:mt-1 print:text-[12px] print:leading-[1.35]">
          {props.cv.head.location}
        </p>
      </div>
      <p class="m-0 mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1 lg:pb-1 print:mt-2 print:flex print:flex-wrap print:gap-x-5 print:gap-y-1">
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
    </header>

    <div class={columnsClass}>
      <div class="min-w-0 [&>section:first-child>h2]:mt-0">
        <section>
          <h2>{props.copy.summary}</h2>
          <div innerHTML={md2html(props.cv.summaryMD)} />
        </section>

        <section>
          <h2>{props.copy.experience}</h2>
          <For each={props.cv.experience}>
            {experience => (
              <Org org={experience.org}>
                <div class={orgHeaderClass}>
                  <div class={orgHeadlineClass}>
                    <Show
                      when={experience.title}
                      fallback={
                        <p class={orgTitleClass}>
                          <a
                            href={experience.org.url}
                            target="_blank"
                            rel="noreferrer"
                            class={orgMetaLinkClass}
                          >
                            {experience.org.name}
                          </a>
                        </p>
                      }
                    >
                      {title => <h3 class={orgTitleClass}>{title()}</h3>}
                    </Show>
                    <p class={orgMutedClass}>
                      {fmtExpTime({ ...experience, locale: props.locale })}
                    </p>
                  </div>
                  <p class={orgMetaClass}>
                    <Show when={experience.title}>
                      <a
                        href={experience.org.url}
                        target="_blank"
                        rel="noreferrer"
                        class={orgMetaLinkClass}
                      >
                        {experience.org.name}
                      </a>
                      <span class="text-date"> · </span>
                    </Show>
                    <span class="text-sm text-date print:text-[12px]">
                      {experience.location}
                    </span>
                  </p>
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
      </div>

      <div class="min-w-0 lg:[&>section:first-child>h2]:mt-0">
        <section>
          <h2>{props.copy.skills}</h2>
          <ul class="not-prose m-0 grid list-none gap-y-4 p-0 print:block">
            <For each={props.cv.skills.map(splitSkill)}>
              {skill => (
                <li class="m-0 leading-7 text-zinc-800 print:mb-0.5 print:leading-[1.35]">
                  <Show when={skill.label}>
                    {label => (
                      <>
                        <strong class="block text-sm leading-6 font-semibold text-zinc-900 print:inline print:text-[12px] print:leading-[1.35]">
                          {label()}
                        </strong>
                        {/* Real text, so extractors read the source line intact. */}
                        <span class="sr-only print:not-sr-only"> — </span>
                      </>
                    )}
                  </Show>
                  {skill.items}
                </li>
              )}
            </For>
          </ul>
        </section>

        <section>
          <h2>{props.copy.education}</h2>
          <For each={props.cv.education}>
            {education => (
              <Org org={education.org}>
                <div class={orgHeaderClass}>
                  <h3 class={orgTitleClass}>
                    <a
                      href={education.org.url}
                      target="_blank"
                      rel="noreferrer"
                      class={orgLinkClass}
                    >
                      {education.org.name}
                    </a>
                  </h3>
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
          <h2>{props.copy.awards}</h2>
          <For each={props.cv.awards}>
            {award => (
              <Org org={award.org}>
                <div class={orgHeaderClass}>
                  <h3 class={orgTitleClass}>
                    <a
                      href={award.url}
                      target="_blank"
                      rel="noreferrer"
                      class={orgLinkClass}
                    >
                      {award.title}
                    </a>
                  </h3>
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
                <Show when={award.summaryMD}>
                  {summary => <div innerHTML={md2html(summary())} />}
                </Show>
              </Org>
            )}
          </For>
        </section>
      </div>
    </div>
  </SiteShell>
)
