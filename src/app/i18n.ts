export const locales = ["en", "ru", "tt"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

/** Normalize non-root locale URLs for callers that require no trailing slash. */
export const normalizeLocaleHref = (href: string): string =>
  href !== "/" && href.endsWith("/") ? href.slice(0, -1) : href
