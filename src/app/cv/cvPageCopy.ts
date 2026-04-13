import type { Locale } from "../i18n"

export interface CVPageCopy {
  awards: string
  backToHomeLabel: string
  cvTitle: string
  education: string
  experience: string
  iconAlt: {
    email: string
    github: string
    linkedin: string
    website: string
  }
  summary: string
  switcherLabel: string
  workedOn: string
}

export const cvPageCopy: Record<Locale, CVPageCopy> = {
  en: {
    awards: "Honors & awards",
    backToHomeLabel: "Home",
    cvTitle: "Adel Nizamutdinov's CV",
    education: "Education",
    experience: "Experience",
    iconAlt: {
      email: "email",
      github: "github",
      linkedin: "linkedin",
      website: "website",
    },
    summary: "Summary",
    switcherLabel: "Switch language",
    workedOn: "Worked on:",
  },
  ru: {
    awards: "Награды и достижения",
    backToHomeLabel: "Главная",
    cvTitle: "Резюме Аделя Низамутдинова",
    education: "Образование",
    experience: "Опыт",
    iconAlt: {
      email: "электронная почта",
      github: "github",
      linkedin: "linkedin",
      website: "сайт",
    },
    summary: "О себе",
    switcherLabel: "Сменить язык",
    workedOn: "Работал над:",
  },
  tt: {
    awards: "Бүләкләр һәм казанышлар",
    backToHomeLabel: "Баш бит",
    cvTitle: "Адель Низамутдиновның CV",
    education: "Белем",
    experience: "Эш тәрибәсе",
    iconAlt: {
      email: "электрон почта",
      github: "github",
      linkedin: "linkedin",
      website: "сайт",
    },
    summary: "Кыскача",
    switcherLabel: "Телне алыштыру",
    workedOn: "Эшләгән проектлар:",
  },
}
