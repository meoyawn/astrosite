import type { Locale } from "../i18n"

export interface CVPageCopy {
  awards: string
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
  workedOn: string
}

export const cvPageCopy: Record<Locale, CVPageCopy> = {
  en: {
    awards: "Honors & awards",
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
    workedOn: "Worked on:",
  },
  ru: {
    awards: "Награды и достижения",
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
    workedOn: "Работал над:",
  },
  tt: {
    awards: "Бүләкләр һәм казанышлар",
    cvTitle: "Гадел Низаметдиновның CV",
    education: "Белем",
    experience: "Эш тәрибәсе",
    iconAlt: {
      email: "электрон почта",
      github: "github",
      linkedin: "linkedin",
      website: "сайт",
    },
    summary: "Кыскача",
    workedOn: "Эшләгән проектлар:",
  },
}
