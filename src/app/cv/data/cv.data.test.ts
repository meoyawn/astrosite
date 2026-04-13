import { describe, expect, test } from "vitest"
import type { Locale } from "../../i18n"
import { cvPageCopy } from "../cvPageCopy"
import { getCV } from "./cv.data"

describe("cv data", () => {
  test.each<[Locale, string, string]>([
    ["en", "Adel Nizamutdinov", "Adel Nizamutdinov's CV"],
    ["ru", "Adel Nizamutdinov", "Резюме Аделя Низамутдинова"],
    ["tt", "Адель Низамутдинов", "Адель Низамутдиновның CV"],
  ])("loads the %s yaml source", (locale, expectedName, expectedCVTitle) => {
    const cv = getCV(locale)

    expect(cv.head.name).toEqual(expectedName)
    expect(cvPageCopy[locale].cvTitle).toEqual(expectedCVTitle)
    expect(cv.experience.length).toBeGreaterThan(0)
    expect(cv.education.length).toBeGreaterThan(0)
    expect(cv.awards.length).toBeGreaterThan(0)
  })
})
