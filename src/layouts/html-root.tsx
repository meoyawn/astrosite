import type { JSX } from "solid-js"
import { ssr } from "solid-js/web"
import { getImage } from "solid-static/image"
import type { Locale } from "../app/i18n.ts"
import favicon from "../assets/favicon.svg?no-inline"
import openGraphImageSource from "../assets/og.svg?no-inline"
import stylesheet from "../styles/global.css?url"

export interface HtmlRootProps {
  bodyStart?: JSX.Element
  canonicalPath: string
  children: JSX.Element
  description: string
  lang: Locale
  openGraphType: "article" | "website"
  publishedAt?: Date | undefined
  modifiedAt?: Date | undefined
  title: string
}

const openGraphImageWidth = 1200
const openGraphImageHeight = 630
const openGraphImageAlt = "Black angular mark on a white field"
const openGraphImage = await getImage({
  format: "png",
  height: openGraphImageHeight,
  quality: "max",
  src: openGraphImageSource,
  width: openGraphImageWidth,
})
const openGraphImageUrl = new URL(
  openGraphImage.src,
  import.meta.env.SITE_ORIGIN,
).href
const siteUrl = new URL("/", import.meta.env.SITE_ORIGIN).href
const personId = new URL("#person", siteUrl).href
const organizationId = new URL("#organization", siteUrl).href

const canonicalUrlFor = (path: string): string =>
  new URL(path, import.meta.env.SITE_ORIGIN).href

const isSolidSsrNode = (value: unknown): value is JSX.Element =>
  typeof value === "object" &&
  value !== null &&
  "t" in value &&
  typeof value.t === "string"

function emailObfuscationComment(closing: boolean): JSX.Element {
  const comment = ssr(closing ? "<!--/email_off-->" : "<!--email_off-->")

  if (!isSolidSsrNode(comment)) {
    throw new TypeError("Email obfuscation comment could not be serialized")
  }

  return comment
}

const structuredDataFor = (props: HtmlRootProps): string =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: "Adel Nizamutdinov",
        description:
          "Software engineer and consultant building products, APIs, and developer tools.",
        url: siteUrl,
        jobTitle: "Software engineer and consultant",
        sameAs: [
          "https://github.com/meoyawn",
          "https://www.linkedin.com/in/adelnizamuddin",
        ],
        worksFor: { "@id": organizationId },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Pneuma LLC",
        description:
          "The software development and consulting business operated by Adel Nizamutdinov.",
        url: siteUrl,
        logo: openGraphImageUrl,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "business inquiries",
          email: "mail@adelnz.com",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kazan",
          addressRegion: "Tatarstan",
          addressCountry: "RU",
        },
      },
      ...(props.openGraphType === "article"
        ? [{
            "@type": "BlogPosting",
            "@id": canonicalUrlFor(props.canonicalPath),
            url: canonicalUrlFor(props.canonicalPath),
            mainEntityOfPage: canonicalUrlFor(props.canonicalPath),
            headline: props.title,
            description: props.description,
            inLanguage: props.lang,
            image: openGraphImageUrl,
            author: { "@id": personId },
            publisher: { "@id": organizationId },
            datePublished: props.publishedAt?.toISOString(),
            dateModified: (props.modifiedAt ?? props.publishedAt)?.toISOString(),
          }]
        : []),
    ],
  }).replaceAll("<", "\\u003c")

export const HtmlRoot = (props: HtmlRootProps): JSX.Element => (
  <html lang={props.lang} class="scroll-smooth motion-reduce:scroll-auto">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width" />
      <link
        rel="icon"
        type="image/svg+xml"
        sizes="any"
        href={favicon}
      />
      <title>{props.title}</title>
      <meta name="description" content={props.description} />
      <meta name="title" content={props.title} />
      <link rel="canonical" href={canonicalUrlFor(props.canonicalPath)} />
      <meta property="og:site_name" content="Adel Nizamutdinov" />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <meta property="og:type" content={props.openGraphType} />
      <meta property="og:url" content={canonicalUrlFor(props.canonicalPath)} />
      <meta property="og:image" content={openGraphImageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content={String(openGraphImageWidth)} />
      <meta property="og:image:height" content={String(openGraphImageHeight)} />
      <meta property="og:image:alt" content={openGraphImageAlt} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:site" content="@meoyawn" />
      <meta name="twitter:creator" content="@meoyawn" />
      <meta name="twitter:title" content={props.title} />
      <meta name="twitter:description" content={props.description} />
      <meta name="twitter:image" content={openGraphImageUrl} />
      <meta name="twitter:image:alt" content={openGraphImageAlt} />
      <script type="application/ld+json">
        {structuredDataFor(props)}
      </script>
      <link rel="stylesheet" href={stylesheet} />
    </head>
    <body class="m-0 min-h-screen bg-white font-sans text-[15px] leading-6 tracking-[-0.01em] text-zinc-950 antialiased">
      {emailObfuscationComment(false)}
      {props.bodyStart}
      {props.children}
      {emailObfuscationComment(true)}
    </body>
  </html>
)
