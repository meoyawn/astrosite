import { describe, expect, test } from "bun:test"
import cvEn from "../../../pages/cv.yaml" with { type: "yaml" }
import cvRu from "../../../pages/ru/cv.yaml" with { type: "yaml" }
import cvTt from "../../../pages/tt/cv.yaml" with { type: "yaml" }
import { parseCV } from "./cv.data.ts"

describe("CV data schema", () => {
  test("validates every localized cv.yaml", () => {
    for (const [sourceName, value] of [
      ["src/pages/cv.yaml", cvEn],
      ["src/pages/ru/cv.yaml", cvRu],
      ["src/pages/tt/cv.yaml", cvTt],
    ] as const) {
      expect(() => parseCV(value, sourceName)).not.toThrow()
    }
  })
})
