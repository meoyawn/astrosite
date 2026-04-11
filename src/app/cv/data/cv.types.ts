export interface Org {
  name: string
  url: string
  imgURL?: string
}

export interface Product {
  name: string
  url: string
  imgURL?: string
}

export interface Head {
  name: string
  title: string
  location: string
  email: string
  url: string
  linkedin: string
  github: string
}

export interface Experience {
  title?: string
  org: Org
  location: string
  start: string
  end?: string
  products: Product[]
  summaryMD: string
}

export interface Education {
  org: Org
  start: string
  end?: string
  products: Product[]
  degreeMD: string
}

export interface Award {
  title: string
  url: string
  org: Org
  date: string
}

export interface TechSkills {
  languages: string[]
  frontend: string[]
  mobile: string[]
  design: string[]
  database: string[]
  backend: string[]
  misc: string[]
  payments: string[]
  marketing: string[]
}

export interface CV {
  head: Head
  summaryMD: string
  experience: Experience[]
  education: Education[]
  awards: Award[]
  skills: string[]
  "tech-skills": TechSkills
}
