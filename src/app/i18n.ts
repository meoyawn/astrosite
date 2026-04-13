export const locales = ["en", "ru"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

/** Trailing slash off for non-root URLs; matches locale switcher behavior. */
export const normalizeLocaleHref = (href: string): string =>
  href !== "/" && href.endsWith("/") ? href.slice(0, -1) : href
