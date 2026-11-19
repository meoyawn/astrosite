import type { Page } from "@playwright/test"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import type { TextItem } from "pdfjs-dist/types/src/display/api"
import { routes } from "../src/routes.ts"
import { builtOrigin, routeBuiltFiles } from "./site.ts"

const cvPrintMargin = {
  bottom: "10mm",
  left: "10mm",
  right: "10mm",
  top: "10mm",
}

export const cvPrintFormats = ["A4", "Letter"] as const

export interface PrintedCv {
  pdf: Buffer
  /** Visible text blocks of the printed page, in document order. */
  phrases: string[]
}

/** Prints the built CV the way a browser's Save as PDF does. */
export async function printCv(
  page: Page,
  format: (typeof cvPrintFormats)[number],
): Promise<PrintedCv> {
  await routeBuiltFiles(page)

  const response = await page.goto(`${builtOrigin}${routes.cv}`)

  if (!(response?.ok() ?? false)) {
    throw new Error(`Expected ${routes.cv} to load.`)
  }

  await page.emulateMedia({ media: "print" })

  return {
    phrases: await printedPhrases(page),
    pdf: await page.pdf({ format, margin: cvPrintMargin, printBackground: true }),
  }
}

export const pdfPageCount = (pdf: Buffer): number =>
  pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length ?? 0

/** Common job-board upload ceilings start at 2 MB. */
export const cvPdfMaxBytes = 2_000_000

const blockSelector = "h1, h2, h3, h4, p, li, dt, dd"

/**
 * Visible text blocks of the CV under the current media, in document order.
 * These are what an ATS must read back from the printed PDF.
 */
const printedPhrases = (page: Page): Promise<string[]> =>
  page.locator("main").evaluate((main, selector) =>
    [...main.querySelectorAll<HTMLElement>(selector)]
      .filter(block =>
        block.querySelector(selector) === null &&
        block.getClientRects().length > 0,
      )
      .map(block => block.innerText)
      .filter(text => text.trim() !== ""), blockSelector)

export const normalizeExtractedText = (text: string): string =>
  text.normalize("NFC").replaceAll("­", "").replace(/\s+/g, " ").trim()

/** Phrases an extractor lost, broke, or returned out of document order. */
export function unreadPhrases(text: string, phrases: string[]): string[] {
  const extracted = normalizeExtractedText(text)
  const unread: string[] = []
  let cursor = 0

  for (const phrase of phrases.map(normalizeExtractedText)) {
    const at = extracted.indexOf(phrase, cursor)

    if (at === -1) {
      unread.push(phrase)
    } else {
      cursor = at + phrase.length
    }
  }

  return unread
}

/** Presentation-form ligatures (ﬀ ﬁ ﬂ ﬃ ﬄ ﬅ ﬆ) break keyword matching. */
export const ligaturePattern = /[ﬀ-ﬆ]/u

/**
 * Chromium embeds variable system fonts as Type 3, which carry no word-space
 * glyphs and can map glyphs to the wrong code points.
 */
export const type3FontCount = (pdf: Buffer): number =>
  pdf.toString("latin1").match(/\/Subtype\s*\/Type3\b/g)?.length ?? 0

export interface PdfReading {
  /** Text in content-stream order, as most extractors return it. */
  stream: string
  /** Text re-sorted top-to-bottom, left-to-right, as layout-sorting extractors do. */
  positional: string
}

const isTextItem = (item: object): item is TextItem => "str" in item

function positionalText(items: TextItem[]): string {
  const lines: TextItem[][] = []

  for (const item of items.filter(textItem => textItem.str !== "")) {
    const baseline = item.transform[5] ?? 0
    const line = lines.find(candidate =>
      Math.abs((candidate[0]?.transform[5] ?? 0) - baseline) <
        Math.max(item.height, 1) / 2,
    )

    if (line === undefined) {
      lines.push([item])
    } else {
      line.push(item)
    }
  }

  return lines
    .toSorted((a, b) => (b[0]?.transform[5] ?? 0) - (a[0]?.transform[5] ?? 0))
    .map(line => {
      const sorted = line.toSorted(
        (a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0),
      )

      return sorted
        .map((item, index) => {
          const previous = sorted[index - 1]
          const gap = previous === undefined
            ? 0
            : (item.transform[4] ?? 0) -
              ((previous.transform[4] ?? 0) + previous.width)

          return gap > Math.max(item.height, 1) * 0.15 ? ` ${item.str}` : item.str
        })
        .join("")
    })
    .join("\n")
}

/** Reads a PDF with pdf.js, the engine behind Firefox and many web-based parsers. */
export async function readPdf(pdf: Buffer): Promise<PdfReading> {
  const loadingTask = getDocument({
    data: new Uint8Array(pdf),
    verbosity: 0,
  })
  const document = await loadingTask.promise
  const pages = await Promise.all(
    Array.from({ length: document.numPages }, async (_, index) => {
      const content = await (await document.getPage(index + 1)).getTextContent({
        // Keep ligatures and other presentation forms exactly as the PDF stores them.
        disableNormalization: true,
      })

      return content.items.filter(isTextItem)
    }),
  )

  await loadingTask.destroy()

  return {
    positional: pages.map(positionalText).join("\n"),
    stream: pages
      .map(items =>
        items.map(item => item.str + (item.hasEOL ? "\n" : "")).join(""),
      )
      .join("\n"),
  }
}
