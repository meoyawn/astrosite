import type { Locale } from "./i18n.ts"

export interface SiteCopy {
  about: string
  contact: string
  consulting: string
  cv: string
  footerLabel: string
  home: string
  navLabel: string
  privacy: string
  switcherLabel: string
  writing: string
}

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    about: "About",
    contact: "Contact",
    consulting: "Consulting",
    cv: "CV",
    footerLabel: "Site information",
    home: "Home",
    navLabel: "Site navigation",
    privacy: "Privacy",
    switcherLabel: "Switch language",
    writing: "Writing",
  },
  ru: {
    about: "Обо мне",
    contact: "Контакты",
    consulting: "Консалтинг",
    cv: "Резюме",
    footerLabel: "Информация о сайте",
    home: "Главная",
    navLabel: "Навигация по сайту",
    privacy: "Приватность",
    switcherLabel: "Сменить язык",
    writing: "Пишу",
  },
  tt: {
    about: "Минем турында",
    contact: "Элемтә",
    consulting: "Консалтинг",
    cv: "Резюме",
    footerLabel: "Сайт турында",
    home: "Баш бит",
    navLabel: "Сайт навигациясе",
    privacy: "Хосусыйлык",
    switcherLabel: "Башка телләр",
    writing: "Язганнарым",
  },
}
