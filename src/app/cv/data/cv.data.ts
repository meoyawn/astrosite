import { load } from "js-yaml"
import type {
  Award,
  CV,
  Education,
  Experience,
  Head,
  Org,
  Product,
} from "./cv.types"
import cvSource from "./cv.yaml?raw"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === "string"

const normalizeDate = (value: unknown): unknown =>
  value instanceof Date ? value.toISOString() : value

const normalizeExperience = (value: unknown): unknown =>
  isRecord(value)
    ? {
        ...value,
        start: normalizeDate(value.start),
        end: normalizeDate(value.end),
      }
    : value

const normalizeEducation = (value: unknown): unknown =>
  isRecord(value)
    ? {
        ...value,
        start: normalizeDate(value.start),
        end: normalizeDate(value.end),
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

const isOrg = (value: unknown): value is Org =>
  isRecord(value) &&
  isString(value.name) &&
  isString(value.url) &&
  (value.imgURL === undefined || isString(value.imgURL))

const isProduct = (value: unknown): value is Product =>
  isRecord(value) &&
  isString(value.name) &&
  isString(value.url) &&
  (value.imgURL === undefined || isString(value.imgURL))

const isHead = (value: unknown): value is Head =>
  isRecord(value) &&
  isString(value.name) &&
  isString(value.title) &&
  isString(value.location) &&
  isString(value.email) &&
  isString(value.url) &&
  isString(value.linkedin) &&
  isString(value.github)

const isExperience = (value: unknown): value is Experience =>
  isRecord(value) &&
  (value.title === undefined || isString(value.title)) &&
  isOrg(value.org) &&
  isString(value.location) &&
  isString(value.start) &&
  (value.end === undefined || isString(value.end)) &&
  Array.isArray(value.products) &&
  value.products.every(isProduct) &&
  isString(value.summaryMD)

const isEducation = (value: unknown): value is Education =>
  isRecord(value) &&
  isOrg(value.org) &&
  isString(value.start) &&
  (value.end === undefined || isString(value.end)) &&
  Array.isArray(value.products) &&
  value.products.every(isProduct) &&
  isString(value.degreeMD)

const isAward = (value: unknown): value is Award =>
  isRecord(value) &&
  isString(value.title) &&
  isString(value.url) &&
  isOrg(value.org) &&
  isString(value.date)

const isCV = (value: unknown): value is CV =>
  isRecord(value) &&
  isHead(value.head) &&
  isString(value.summaryMD) &&
  Array.isArray(value.experience) &&
  value.experience.every(isExperience) &&
  Array.isArray(value.education) &&
  value.education.every(isEducation) &&
  Array.isArray(value.awards) &&
  value.awards.every(isAward) &&
  Array.isArray(value.skills) &&
  value.skills.every(isString)

const parseCV = (value: unknown): CV => {
  if (!isCV(value)) {
    throw new TypeError("cv.yaml does not match the expected shape")
  }

  return value
}

const cv = parseCV(normalizeCV(load(cvSource)))

export default cv
