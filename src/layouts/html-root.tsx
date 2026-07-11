import type { JSX } from "solid-js"
import type { Locale } from "../app/i18n.ts"
import favicon from "../assets/favicon.svg?no-inline"
import stylesheet from "../styles/global.css?url"

export interface HtmlRootProps {
  children: JSX.Element
  description: string
  lang: Locale
  title: string
}

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
      <meta property="og:site_name" content="adelnz.com" />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <link rel="stylesheet" href={stylesheet} />
    </head>
    <body class="bg-white text-zinc-950">{props.children}</body>
  </html>
)
