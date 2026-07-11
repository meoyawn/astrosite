import { load } from "js-yaml"
import { createCvRoute } from "../app/cv/create-cv-route.tsx"
import { cvPageCopy } from "../app/cv/cvPageCopy.ts"
import { parseCV } from "../app/cv/data/cv.data.ts"
import cvSource from "./cv.yaml?raw"

export default createCvRoute(
  parseCV(load(cvSource), "pages/cv.yaml"),
  cvPageCopy.en,
  "en",
)
