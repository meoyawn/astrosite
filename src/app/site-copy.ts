import type { Locale } from "./i18n.ts"

export interface SiteCopy {
  consulting: string
  cv: string
  home: string
  navLabel: string
  switcherLabel: string
  writing: string
}

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    consulting: "Consulting",
    cv: "CV",
    home: "Home",
    navLabel: "Site navigation",
    switcherLabel: "Switch language",
    writing: "Writing",
  },
  ru: {
    consulting: "Консалтинг",
    cv: "Резюме",
    home: "Главная",
    navLabel: "Навигация по сайту",
    switcherLabel: "Сменить язык",
    writing: "Пишу",
  },
  tt: {
    consulting: "Консалтинг",
    cv: "Резюме",
    home: "Баш бит",
    navLabel: "Сайт навигациясе",
    switcherLabel: "Башка телләр",
    writing: "Язганнарым",
  },
}
