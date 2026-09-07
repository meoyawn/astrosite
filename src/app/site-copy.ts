import type { Locale } from "./i18n.ts"

export interface SiteCopy {
  and: string
  consulting: string
  cv: string
  email: string
  home: string
  navLabel: string
  profileLinksLabel: string
  recent: string
  siteTitle: string
  switcherLabel: string
  workingOn: string
  writing: string
}

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    and: "and",
    consulting: "Consulting",
    cv: "CV",
    email: "Email",
    home: "Home",
    navLabel: "Site navigation",
    profileLinksLabel: "Elsewhere",
    recent: "Recent",
    siteTitle: "Producing software",
    switcherLabel: "Switch language",
    workingOn: "Working on",
    writing: "Writing",
  },
  ru: {
    and: "и",
    consulting: "Консалтинг",
    cv: "Резюме",
    email: "Почта",
    home: "Главная",
    navLabel: "Навигация по сайту",
    profileLinksLabel: "Ссылки",
    recent: "Недавнее",
    siteTitle: "Выпускаю софт",
    switcherLabel: "Сменить язык",
    workingOn: "Работаю над",
    writing: "Пишу",
  },
  tt: {
    and: "һәм",
    consulting: "Консалтинг",
    cv: "Резюме",
    email: "Почта",
    home: "Баш бит",
    navLabel: "Сайт навигациясе",
    profileLinksLabel: "Сылтамалар",
    recent: "Соңгы язмалар",
    siteTitle: "Программалар чыгарам",
    switcherLabel: "Башка телләр",
    workingOn: "Хәзерге проектлар:",
    writing: "Язганнарым",
  },
}
