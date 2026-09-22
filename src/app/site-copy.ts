import type { Locale } from "./i18n.ts"

export interface SiteCopy {
  and: string
  workTogether: string
  cv: string
  email: string
  home: string
  navLabel: string
  profileLinksLabel: string
  projectsPrefix: string
  projectsSuffix: string
  recent: string
  siteTitle: string
  switcherLabel: string
  writing: string
}

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    and: "and",
    workTogether: "Work together",
    cv: "CV",
    email: "Email",
    home: "Home",
    navLabel: "Site navigation",
    profileLinksLabel: "Elsewhere",
    projectsPrefix: "Building ",
    projectsSuffix: ".",
    recent: "Recent",
    siteTitle: "Producing software",
    switcherLabel: "Switch language",
    writing: "Writing",
  },
  ru: {
    and: "и",
    workTogether: "Поработаем вместе",
    cv: "Резюме",
    email: "Почта",
    home: "Главная",
    navLabel: "Навигация по сайту",
    profileLinksLabel: "Ссылки",
    projectsPrefix: "Делаю ",
    projectsSuffix: ".",
    recent: "Недавнее",
    siteTitle: "Выпускаю софт",
    switcherLabel: "Сменить язык",
    writing: "Пишу",
  },
  tt: {
    and: "һәм",
    workTogether: "Бергә эшлик",
    cv: "Резюме",
    email: "Почта",
    home: "Баш бит",
    navLabel: "Сайт навигациясе",
    profileLinksLabel: "Сылтамалар",
    projectsPrefix: "",
    projectsSuffix: " булдырам.",
    recent: "Соңгы язмалар",
    siteTitle: "Программалар чыгарам",
    switcherLabel: "Башка телләр",
    writing: "Язганнарым",
  },
}
