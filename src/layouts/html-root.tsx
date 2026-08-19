import type { JSX } from "solid-js"
import { getImage } from "solid-static/image"
import type { Locale } from "../app/i18n.ts"
import favicon from "../assets/favicon.svg?no-inline"
import openGraphImageSource from "../assets/og.svg?no-inline"
import stylesheet from "../styles/global.css?url"

export interface HtmlRootProps {
  children: JSX.Element
  description: string
  lang: Locale
  openGraphType: "article" | "website"
  title: string
}

const openGraphImageWidth = 1200
const openGraphImageHeight = 630
const openGraphImageAlt = "Black angular mark on a white field"
const openGraphImage = await getImage({
  format: "jpg",
  height: openGraphImageHeight,
  quality: "max",
  src: openGraphImageSource,
  width: openGraphImageWidth,
})
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
      <meta property="og:site_name" content="Adel Nizamutdinov" />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <meta property="og:type" content={props.openGraphType} />
      <meta property="og:image" content={openGraphImage.src} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content={String(openGraphImageWidth)} />
      <meta property="og:image:height" content={String(openGraphImageHeight)} />
      <meta property="og:image:alt" content={openGraphImageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@meoyawn" />
      <meta name="twitter:creator" content="@meoyawn" />
      <meta name="twitter:title" content={props.title} />
      <meta name="twitter:description" content={props.description} />
      <meta name="twitter:image" content={openGraphImage.src} />
      <meta name="twitter:image:alt" content={openGraphImageAlt} />
      <link rel="stylesheet" href={stylesheet} />
    </head>
    <body class="bg-white text-zinc-950">{props.children}</body>
  </html>
)
