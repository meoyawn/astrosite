import { format, formatDuration, intervalToDuration } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import type { Locale as DateFnsLocale } from "date-fns/locale"
import type { Locale as SiteLocale } from "../i18n"

const dateFnsLocaleByLocale = {
  en: enUS,
  ru,
  tt: ru,
} as const satisfies Record<SiteLocale, DateFnsLocale>

const dateFormatByLocale: Record<SiteLocale, string> = {
  en: "MMMM y",
  ru: "LLLL y",
  tt: "LLLL y",
}

const presentByLocale: Record<SiteLocale, string> = {
  en: "Present",
  ru: "н.в.",
  tt: "хәзергә",
}

export const fmtDate = (start: string, locale: SiteLocale): string =>
  format(new Date(start), dateFormatByLocale[locale], {
    locale: dateFnsLocaleByLocale[locale],
  })

const fmtDur = (
  start: string,
  end: string | undefined,
  locale: SiteLocale,
): string =>
  formatDuration(
    intervalToDuration({
      start: new Date(start),
      end: new Date(end ?? Date.now()),
    }),
    {
      format: ["years", "months"],
      locale: dateFnsLocaleByLocale[locale],
    },
  )

export const fmtExpTime = ({
  locale,
  start,
  end,
  duration = true,
}: {
  locale: SiteLocale
  start: string
  end?: string
  duration?: boolean
}): string => {
  const dur = duration ? ` (${fmtDur(start, end, locale)})` : ""
  return `${fmtDate(start, locale)} - ${end ? fmtDate(end, locale) : presentByLocale[locale]}${dur}`
}
