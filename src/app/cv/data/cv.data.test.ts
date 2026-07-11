import { load } from "js-yaml"
import { describe, expect, test } from "vitest"
import cvEnSource from "../../../pages/cv.yaml?raw"
import cvRuSource from "../../../pages/ru/cv.yaml?raw"
import cvTtSource from "../../../pages/tt/cv.yaml?raw"
import { parseCV } from "./cv.data.ts"

describe("CV data schema", () => {
  test("validates every localized cv.yaml", () => {
    for (const [sourceName, value] of [
      ["src/pages/cv.yaml", load(cvEnSource)],
      ["src/pages/ru/cv.yaml", load(cvRuSource)],
      ["src/pages/tt/cv.yaml", load(cvTtSource)],
    ] as const) {
      expect(() => parseCV(value, sourceName)).not.toThrow()
    }
  })
})
