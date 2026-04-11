import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import sharp from "sharp"
import { afterEach, describe, expect, test } from "vitest"

import { DEFAULT_WIDTH } from "./screenshot"
import delayedFixtureHtml from "./delayed.html" with { type: "text" }
import fixtureHtml from "./test.html" with { type: "text" }

let tempDir: string | undefined

const getAvailablePort = () =>
  Math.floor(Math.random() * (65_000 - 10_000 + 1)) + 10_000

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { force: true, recursive: true })
    tempDir = undefined
  }
})

const withFixtureServer = async (
  fixture: string,
  func: (url: URL) => Promise<void>,
) => {
  const port = getAvailablePort()
  const server = Bun.serve({
    fetch(request) {
      return new URL(request.url).pathname === "/test.html"
        ? new Response(fixture, {
            headers: { "content-type": "text/html; charset=utf-8" },
          })
        : new Response("Not found", { status: 404 })
    },
    hostname: "::1",
    port,
  })

  try {
    await func(new URL(`http://[::1]:${port}/test.html`))
  } finally {
    await server.stop(true)
  }
}

const getCenterPixel = async (path: string) => {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const x = Math.floor(info.width / 2)
  const y = Math.floor(info.height / 2)
  const offset = (y * info.width + x) * info.channels

  return [...data.subarray(offset, offset + info.channels)]
}

describe("screenshot script", () => {
  test("writes an image using the default output width", async () => {
    await withFixtureServer(fixtureHtml.index, async url => {
      tempDir = await mkdtemp(join(tmpdir(), "screenshot-test-"))
      const outputPath = join(tempDir, "fixture.png")

      const process = Bun.spawn(
        ["bun", "scripts/screenshot.ts", url.href, outputPath],
        { stderr: "pipe", stdout: "pipe" },
      )
      const [exitCode, stderr] = await Promise.all([
        process.exited,
        new Response(process.stderr).text(),
      ])

      if (exitCode !== 0) {
        throw new Error(stderr || `screenshot.ts exited with code ${exitCode}`)
      }

      const metadata = await sharp(outputPath).metadata()

      expect(metadata.width).toEqual(DEFAULT_WIDTH)
    })
  })

  test("exits with an error when the URL is invalid", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "screenshot-test-"))
    const outputPath = join(tempDir, "fixture.png")

    const process = Bun.spawn(
      ["bun", "scripts/screenshot.ts", "not-a-url", outputPath],
      { stderr: "pipe", stdout: "pipe" },
    )
    const [exitCode, stderr] = await Promise.all([
      process.exited,
      new Response(process.stderr).text(),
    ])

    expect(exitCode).toEqual(1)
    expect(stderr.trim()).toEqual("not-a-url is not a valid URL")
  })

  test("waits for delayed content before capturing", async () => {
    await withFixtureServer(delayedFixtureHtml.index, async url => {
      tempDir = await mkdtemp(join(tmpdir(), "screenshot-test-"))
      const outputPath = join(tempDir, "delayed.png")

      const process = Bun.spawn(
        ["bun", "scripts/screenshot.ts", url.href, outputPath],
        { stderr: "pipe", stdout: "pipe" },
      )
      const [exitCode, stderr] = await Promise.all([
        process.exited,
        new Response(process.stderr).text(),
      ])

      if (exitCode !== 0) {
        throw new Error(stderr || `screenshot.ts exited with code ${exitCode}`)
      }

      expect(await getCenterPixel(outputPath)).toEqual([12, 34, 56, 255])
    })
  })
})
