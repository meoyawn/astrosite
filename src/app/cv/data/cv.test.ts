import { describe, expect, test } from "vitest"
import cv from "./cv.data"

describe("cv data", () => {
  test("loads the yaml source", () => {
    expect(cv.head.name).toEqual("Adel Nizamutdinov")
    expect(cv.experience.length).toBeGreaterThan(0)
    expect(cv.education.length).toBeGreaterThan(0)
    expect(cv.awards.length).toBeGreaterThan(0)
  })
})
