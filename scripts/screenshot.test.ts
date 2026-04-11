import { mkdtemp, rm } from "node:fs/promises"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import sharp from "sharp"
import { afterEach, describe, expect, test } from "vitest"

import { DEFAULT_WIDTH } from "./screenshot"
import fixtureHtml from "./test.html" with { type: "text" }

let stopServer: (() => void) | undefined
let tempDir: string | undefined

const getAvailablePort = async () =>
  await new Promise<number>((resolve, reject) => {
    const probe = createServer()

    probe.once("error", reject)
    probe.listen(0, "::1", () => {
      const address = probe.address()

      if (!address || typeof address === "string") {
        probe.close()
        reject(new Error("Failed to determine an available IPv6 port"))
        return
      }

      probe.close(error => {
        if (error) {
          reject(error)
          return
        }

        resolve(address.port)
      })
    })
  })

afterEach(async () => {
  stopServer?.()
  stopServer = undefined

  if (tempDir) {
    await rm(tempDir, { force: true, recursive: true })
    tempDir = undefined
  }
})

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

const isSingleColorImage = async (path: string) => {
  const stats = await sharp(path).stats()

  return stats.channels.every(channel => channel.stdev === 0)
}

describe("screenshot script", () => {
  test("writes an image using the default output width", async () => {
    const port = await getAvailablePort()

    const server = Bun.serve({
      fetch(request) {
        return new URL(request.url).pathname === "/test.html"
          ? new Response(fixtureHtml.index, {
              headers: { "content-type": "text/html; charset=utf-8" },
            })
          : new Response("Not found", { status: 404 })
      },
      hostname: "::1",
      port,
    })
    stopServer = () => server.stop(true)

    tempDir = await mkdtemp(join(tmpdir(), "screenshot-test-"))
    const outputPath = join(tempDir, "fixture.png")
    const url = `http://[::1]:${port}/test.html`

    const process = Bun.spawn(
      ["bun", "scripts/screenshot.ts", url, outputPath],
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
    const port = await getAvailablePort()
    const delayedFixtureHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Delayed Screenshot Fixture</title>
    <style>
      html,
      body {
        margin: 0;
        min-height: 100%;
        background: white;
      }
    </style>
  </head>
  <body>
    <script>
      window.setTimeout(() => {
        document.body.innerHTML =
          '<main style="min-height: 1200px; background: rgb(12, 34, 56); color: white; padding: 48px; font: 32px Georgia, serif;">Rendered after load</main>'
      }, 700)
    </script>
  </body>
</html>`

    const server = Bun.serve({
      fetch(request) {
        return new URL(request.url).pathname === "/delayed.html"
          ? new Response(delayedFixtureHtml, {
              headers: { "content-type": "text/html; charset=utf-8" },
            })
          : new Response("Not found", { status: 404 })
      },
      hostname: "::1",
      port,
    })
    stopServer = () => server.stop(true)

    tempDir = await mkdtemp(join(tmpdir(), "screenshot-test-"))
    const outputPath = join(tempDir, "delayed.png")
    const url = `http://[::1]:${port}/delayed.html`

    const process = Bun.spawn(
      ["bun", "scripts/screenshot.ts", url, outputPath],
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
