import { readFile, writeFile } from "fs/promises"
import { load } from "js-yaml"
import { test } from "vitest"
import cv from "../../public/cv.json"
import { fmtDate, fmtDur } from "./cv"

const orgIMG = ({
  imgURL,
  name,
}: (typeof cv)["experience"][number]["org"]): string =>
  imgURL
    ? `<img width="24" src="${imgURL}" alt="${name} logo" style="margin-right: 4px;">`
    : ""

const expToMD = ({
  org,
  summaryMD,
  title,
  start,
  end,
  products,
}: (typeof cv)["experience"][number]): string => `
<h4 style="display: flex; align-items: center;">
  ${orgIMG(org)}
  <span>${title}</span>
</h4>

[${org.name}](${org.url})  
${fmtDate(start)} – ${end ? fmtDate(end) : "Present"} (${fmtDur(start, end)})

${summaryMD}

Built ${products.map(x => `[${x.name}](${x.url})`).join(", ")}.
`

const toMD = ({ experience, head, summaryMD }: typeof cv) =>
  `
---
layout: ../layouts/Root.astro
title: Adel Nizamutdinov's CV
description: Personal website
---

# ${head.name}

### Summary

${summaryMD}

### Experience

${experience.map(x => expToMD(x)).join("\n")}

### Education

`.trim()

test("yaml to json", async () => {
  const obj = load(await readFile("public/cv.yaml", "utf-8"))
  await writeFile("public/cv.json", JSON.stringify(obj, null, 2))
})

test.skip("json to md", async () => {
  const out = "src/pages/cv.md"
  await writeFile(out, toMD(cv))
})
