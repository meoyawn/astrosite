export const locales = ["en", "ru", "tt"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

/**
 * Normalize internal locale URLs to the site's preferred style (no trailing
 * slash for non-root paths).
 *
 * This exists because `astro:i18n` route helpers can generate trailing slashes
 * in some cases (e.g. `/ru/`), and we want consistent internal hrefs like `/ru`
 * while preserving the root path (`/`).
 *
 * See: - https://docs.astro.build/en/reference/modules/astro-i18n/ -
 * https://github.com/withastro/astro/issues/13032 -
 * https://github.com/withastro/astro/issues/9919
 */
export const normalizeLocaleHref = (href: string): string =>
  href !== "/" && href.endsWith("/") ? href.slice(0, -1) : href
