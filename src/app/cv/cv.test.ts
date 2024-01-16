import { readFile, writeFile } from "fs/promises"
import { load } from "js-yaml"
import { test } from "vitest"

test("yaml to json", async () => {
  const obj = load(await readFile("public/cv.yaml", "utf-8"))
  await writeFile("public/cv.json", JSON.stringify(obj, null, 2))
})
