import type { Locale } from "./i18n.ts"

export interface SiteCopy {
  about: string
  and: string
  contact: string
  consulting: string
  cv: string
  email: string
  footerLabel: string
  home: string
  navLabel: string
  privacy: string
  profileLinksLabel: string
  recent: string
  siteTitle: string
  switcherLabel: string
  workingOn: string
  writing: string
}

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    about: "About",
    and: "and",
    contact: "Contact",
    consulting: "Consulting",
    cv: "CV",
    email: "Email",
    footerLabel: "Site information",
    home: "Home",
    navLabel: "Site navigation",
    privacy: "Privacy",
    profileLinksLabel: "Elsewhere",
    recent: "Recent",
    siteTitle: "Producing software",
    switcherLabel: "Switch language",
    workingOn: "Working on",
    writing: "Writing",
  },
  ru: {
    about: "Обо мне",
    and: "и",
    contact: "Контакты",
    consulting: "Консалтинг",
    cv: "Резюме",
    email: "Почта",
    footerLabel: "Информация о сайте",
    home: "Главная",
    navLabel: "Навигация по сайту",
    privacy: "Приватность",
    profileLinksLabel: "Ссылки",
    recent: "Недавнее",
    siteTitle: "Выпускаю софт",
    switcherLabel: "Сменить язык",
    workingOn: "Работаю над",
    writing: "Пишу",
  },
  tt: {
    about: "Минем турында",
    and: "һәм",
    contact: "Элемтә",
    consulting: "Консалтинг",
    cv: "Резюме",
    email: "Почта",
    footerLabel: "Сайт турында",
    home: "Баш бит",
    navLabel: "Сайт навигациясе",
    privacy: "Хосусыйлык",
    profileLinksLabel: "Сылтамалар",
    recent: "Соңгы язмалар",
    siteTitle: "Программалар чыгарам",
    switcherLabel: "Башка телләр",
    workingOn: "Хәзерге проектлар:",
    writing: "Язганнарым",
  },
}
