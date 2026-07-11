import * as v from "valibot"
import type {
  Award,
  CV,
  Education,
  Experience,
  Head,
  Org,
  Product,
} from "./cv.types.ts"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export const githubURL = "https://github.com/meoyawn"
export const linkedinURL = "https://www.linkedin.com/in/adelnizamuddin"
export const twitterURL = "https://twitter.com/meoyawn"

const normalizeDate = (value: unknown): unknown =>
  value instanceof Date ? value.toISOString() : value

const normalizeExperience = (value: unknown): unknown =>
  isRecord(value)
    ? {
        ...value,
        start: normalizeDate(value.start),
        ...("end" in value ? { end: normalizeDate(value.end) } : {}),
      }
    : value

const normalizeEducation = (value: unknown): unknown =>
  isRecord(value)
    ? {
        ...value,
        start: normalizeDate(value.start),
        ...("end" in value ? { end: normalizeDate(value.end) } : {}),
      }
    : value

const normalizeAward = (value: unknown): unknown =>
  isRecord(value)
    ? {
        ...value,
        date: normalizeDate(value.date),
      }
    : value

const normalizeCV = (value: unknown): unknown =>
  isRecord(value)
    ? {
        ...value,
        experience: Array.isArray(value.experience)
          ? value.experience.map(normalizeExperience)
          : value.experience,
        education: Array.isArray(value.education)
          ? value.education.map(normalizeEducation)
          : value.education,
        awards: Array.isArray(value.awards)
          ? value.awards.map(normalizeAward)
          : value.awards,
      }
    : value

const orgSchema: v.GenericSchema<unknown, Org> = v.object({
  imgURL: v.exactOptional(v.string()),
  name: v.string(),
  url: v.string(),
})

const productSchema: v.GenericSchema<unknown, Product> = v.object({
  imgURL: v.exactOptional(v.string()),
  name: v.string(),
  url: v.string(),
})

const headSchema: v.GenericSchema<unknown, Head> = v.object({
  email: v.string(),
  github: v.literal(githubURL, `must use ${githubURL} as GitHub URL`),
  linkedin: v.literal(linkedinURL, `must use ${linkedinURL} as LinkedIn URL`),
  location: v.string(),
  name: v.string(),
  title: v.string(),
  twitter: v.literal(twitterURL, `must use ${twitterURL} as Twitter URL`),
  url: v.string(),
})

const experienceSchema: v.GenericSchema<unknown, Experience> = v.object({
  end: v.exactOptional(v.string()),
  location: v.string(),
  org: orgSchema,
  products: v.array(productSchema),
  start: v.string(),
  summaryMD: v.string(),
  title: v.exactOptional(v.string()),
})

const educationSchema: v.GenericSchema<unknown, Education> = v.object({
  degreeMD: v.string(),
  end: v.exactOptional(v.string()),
  org: orgSchema,
  products: v.array(productSchema),
  start: v.string(),
})

const awardSchema: v.GenericSchema<unknown, Award> = v.object({
  date: v.string(),
  org: orgSchema,
  title: v.string(),
  url: v.string(),
})

export const cvSchema: v.GenericSchema<unknown, CV> = v.object({
  awards: v.array(awardSchema),
  education: v.array(educationSchema),
  experience: v.array(experienceSchema),
  head: headSchema,
  skills: v.array(v.string()),
  summaryMD: v.string(),
})

export const parseCV = (value: unknown, sourceName: string): CV => {
  const result = v.safeParse(cvSchema, normalizeCV(value))

  if (!result.success) {
    throw new TypeError(
      `${sourceName} does not match the CV schema: ${v.summarize(result.issues)}`,
    )
  }

  return result.output
}
