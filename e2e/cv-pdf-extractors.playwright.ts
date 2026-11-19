import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { delimiter, join } from "node:path"
import { expect, test } from "@playwright/test"
import {
  ligaturePattern,
  printCv,
  type PrintedCv,
  unreadPhrases,
} from "./cv-pdf.ts"

interface Extractor {
  name: string
  binary: string
  arguments: (pdfPath: string) => string[]
}

/**
 * Text-extraction engines that ATS and résumé-parsing pipelines build on.
 * Commercial parsers are closed, but each starts by extracting text, so every
 * engine must read the printed CV completely and in order. `mise install`
 * provides them; see mise.toml.
 */
const extractors: Extractor[] = [
  {
    name: "Poppler pdftotext",
    binary: "pdftotext",
    arguments: pdfPath => ["-enc", "UTF-8", pdfPath, "-"],
  },
  {
    name: "Poppler pdftotext -raw",
    binary: "pdftotext",
    arguments: pdfPath => ["-raw", "-enc", "UTF-8", pdfPath, "-"],
  },
  {
    name: "Poppler pdftotext -layout",
    binary: "pdftotext",
    arguments: pdfPath => ["-layout", "-enc", "UTF-8", pdfPath, "-"],
  },
  {
    name: "MuPDF",
    binary: "mutool",
    arguments: pdfPath => ["draw", "-q", "-F", "txt", "-o", "-", pdfPath],
  },
  {
    name: "Ghostscript txtwrite",
    binary: "gs",
    arguments: pdfPath => [
      "-q",
      "-dNOPAUSE",
      "-dBATCH",
      "-dSAFER",
      "-sDEVICE=txtwrite",
      "-sOutputFile=-",
      pdfPath,
    ],
  },
  {
    name: "pdfminer.six",
    binary: "pdf2txt.py",
    arguments: pdfPath => [pdfPath],
  },
  {
    name: "PDFium",
    binary: "pypdfium2",
    arguments: pdfPath => ["extract-text", pdfPath],
  },
]

const onPath = (binary: string): boolean =>
  (process.env.PATH ?? "")
    .split(delimiter)
    .some(directory => directory !== "" && existsSync(join(directory, binary)))

test.describe("cv print PDF read by ATS text extractors", () => {
  // A freshly installed engine's first launch can take several seconds.
  test.describe.configure({ timeout: 30_000 })

  let printed: PrintedCv
  let workDirectory: string
  let pdfPath: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()

    printed = await printCv(page, "A4")
    await page.close()
    workDirectory = mkdtempSync(join(tmpdir(), "cv-pdf-"))
    pdfPath = join(workDirectory, "cv.pdf")
    writeFileSync(pdfPath, printed.pdf)
  })

  test.afterAll(() => {
    rmSync(workDirectory, { force: true, recursive: true })
  })

  for (const extractor of extractors) {
    test(`${extractor.name} reads every printed block in order`, () => {
      test.skip(
        !onPath(extractor.binary),
        `${extractor.binary} is not on PATH; run \`mise install\`.`,
      )

      const result = spawnSync(extractor.binary, extractor.arguments(pdfPath), {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      })

      expect(result.status, result.stderr).toEqual(0)
      expect(printed.phrases.length).toBeGreaterThan(0)
      expect(result.stdout).not.toMatch(ligaturePattern)
      expect(unreadPhrases(result.stdout, printed.phrases)).toEqual([])
    })
  }
})
