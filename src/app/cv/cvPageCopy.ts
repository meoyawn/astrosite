import type { Locale } from "../i18n.ts"

export interface CVPageCopy {
  awards: string
  cvTitle: string
  description: string
  education: string
  experience: string
  iconAlt: {
    email: string
    github: string
    linkedin: string
    website: string
  }
  skills: string
  summary: string
  workedOn: string
}

export const cvPageCopy: Record<Locale, CVPageCopy> = {
  en: {
    awards: "Honors & awards",
    cvTitle: "Adel Nizamutdinov's CV",
    description: "Adel Nizamutdinov's software engineering experience, projects, and skills, spanning SaaS products, APIs, developer tools, and mobile apps.",
    education: "Education",
    experience: "Experience",
    iconAlt: {
      email: "email",
      github: "github",
      linkedin: "linkedin",
      website: "website",
    },
    skills: "Skills",
    summary: "Summary",
    workedOn: "Worked on:",
  },
  ru: {
    awards: "Награды и достижения",
    cvTitle: "Резюме Аделя Низамутдинова",
    description: "Опыт, проекты и навыки разработчика Аделя Низамутдинова: SaaS-продукты, API, инструменты для разработчиков и мобильные приложения.",
    education: "Образование",
    experience: "Опыт",
    iconAlt: {
      email: "электронная почта",
      github: "github",
      linkedin: "linkedin",
      website: "сайт",
    },
    skills: "Навыки",
    summary: "О себе",
    workedOn: "Работал над:",
  },
  tt: {
    awards: "Бүләкләр һәм казанышлар",
    cvTitle: "Гадел Низаметдиновның CV",
    description: "Гадел Низаметдиновның программа ясау тәҗрибәсе, проектлары һәм күнекмәләре: SaaS-продуктлар, API, эш кораллары һәм мобиль кушымталар.",
    education: "Белем",
    experience: "Эш тәрибәсе",
    iconAlt: {
      email: "электрон почта",
      github: "github",
      linkedin: "linkedin",
      website: "сайт",
    },
    skills: "Күнекмәләр",
    summary: "Кыскача",
    workedOn: "Эшләгән проектлар:",
  },
}
