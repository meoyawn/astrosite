import { defaultLocale } from "./app/i18n.ts"
import type { Locale } from "./app/i18n.ts"

export const routes = {
  consulting: "/consulting/",
  cv: "/cv/",
  home: "/",
  now: "/now/",
  travel: "/travel/",
  writing: "/writing/",
} as const

export const trustRoutes = {
  about: "/about/",
  contact: "/contact/",
  privacy: "/privacy/",
} as const

export const navRouteNames = ["home", "consulting", "cv"] as const

export type NavRouteName = (typeof navRouteNames)[number]

export const localizedRoute = (
  locale: Locale,
  route: NavRouteName,
): string => {
  if (locale === defaultLocale) {
    return routes[route]
  }

  return route === "home" ? `/${locale}/` : `/${locale}${routes[route]}`
}

export type TrustRouteName = keyof typeof trustRoutes

export const travelRoute = (eventId?: string): string =>
  eventId === undefined ? routes.travel : `${routes.travel}#${eventId}`

export const writingRoute = (slug: string): string =>
  `${routes.writing}${slug}/`
