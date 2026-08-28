---
title: Single file JavaScript binaries with C++ dependencies
description: Deno packages require("canvas") directly; Bun needs a small extraction shim
published_at: 2026-08-28
---

I wanted to turn a JavaScript server into one executable. It had
to use [`node-canvas`](https://github.com/Automattic/node-canvas), call its C++
N-API addon, and return the correct pixel. Each executable supplied its own
packaged copy of node-canvas.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">To make Claude Code start faster, source code is parsed ahead of time into bytecode. <br><br>Bytecode in the binary was about 9x larger than source code. After several optimizations to JavaScriptCore&#39;s bytecode serialization format &amp; Bun&#39;s bundler, now it&#39;s 2.6x <a href="https://t.co/F98JaeUCOu">pic.twitter.com/F98JaeUCOu</a></p>&mdash; Jarred Sumner (@jarredsumner) <a href="https://x.com/jarredsumner/status/2092809441892774296?ref_src=twsrc%5Etfw">August 27, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

I compared [Bun's compiled executables](https://bun.com/docs/bundler/executables)
and [`deno compile`](https://docs.deno.com/runtime/reference/cli/compile/) on
macOS ARM64 and native ARM64 Linux in Docker.

## How one file contains a native npm package

A `.node` addon is a shared library. Both compilers find and embed
`canvas.node`, but node-canvas's prebuild also contains sibling dylibs or ELF
shared libraries. The operating-system loader needs those as real files beside
the addon.

The input project is deliberately boring:

```text
index.cjs
package.json
node_modules/
  canvas/
    index.js
    lib/
    build/Release/
      canvas.node
      lib*.dylib or lib*.so*
```

Deno's `--self-extracting` mode embeds that installed package tree and
materializes it with the same layout on first launch. No file list, copied
native directory, patched binary, or generated payload is needed.

Bun has no equivalent whole-package extraction mode. Its direct build embeds
the addon but extracts `canvas.node` alone, so `@loader_path/libpixman-1.0.dylib`
on macOS or `libpixman-1.so.0` on Linux cannot be found. The smallest working
fallback is a Bun-only entry wrapper. It embeds the untouched
`node_modules/canvas/build/Release` directory as assets, writes its shared
libraries into a fingerprinted cache, and relaunches the same executable
once with `TMPDIR` pointing there. The child then executes the unchanged test
program.

This produces a single-file distribution: node-canvas's packaged native
libraries ship inside the executable and materialize into the cache at runtime.
Normal host-library requirements can remain; the Linux prebuild's Expat
dependency is described below.

## Deno can run require("canvas")

Yes, Deno can run this CommonJS program. The test uses the explicit `.cjs`
extension, which selects Deno's
[CommonJS compatibility](https://docs.deno.com/runtime/fundamentals/node/#commonjs-support).
The upstream node-canvas `.js` files then use their own unchanged `require()`
calls, including `require("../build/Release/canvas.node")`.

The project has one direct dependency, `canvas@3.2.3`, installed normally with
`bun install`. Its only application file uses the public JavaScript API:

```js
const { Canvas, CanvasRenderingContext2D, createCanvas } = require("canvas");

const canvas = createCanvas(3, 2);
const context = canvas.getContext("2d");
context.fillStyle = "#123456";
context.fillRect(0, 0, canvas.width, canvas.height);

const rgba = Buffer.from(context.getImageData(2, 1, 1, 1).data).toString(
  "hex",
);

if (
  !(canvas instanceof Canvas) ||
  !(context instanceof CanvasRenderingContext2D) ||
  rgba !== "123456ff"
) {
  throw new Error(`wrong canvas result: ${rgba}`);
}
```

Deno needs only its built-in extraction flag:

```sh
deno compile -A --self-extracting --output dist/canvas-deno index.cjs
```

Deno is explicit about the
[`--self-extracting` trade-offs](https://docs.deno.com/runtime/reference/cli/compile/#trade-offs):

- the first launch is slower because it extracts the embedded files;
- the extracted copy consumes additional disk space;
- memory use is higher because embedded content can no longer be referenced as
  static data; and
- the extracted files are mutable, so users or other code can tamper with the
  cache.

The macOS first-start and RAM numbers below make the first and third costs easy
to see. Bun's custom shim has the same extraction, disk, and tamper concerns.

Bun needs this small wrapper, but does not prepare or modify any native file:

```js
const { existsSync, mkdirSync, statSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { basename, join } = require("node:path");

function isSharedLibrary(file) {
  return file.name.endsWith(".dylib") || file.name.includes(".so.");
}

async function main() {
  const libraries = Bun.embeddedFiles.filter(isSharedLibrary);
  const fingerprint = Bun.hash(
    libraries.map((file) => `${file.name}:${file.size}`).join("\n"),
  ).toString(16);

  if (process.env.CANVAS_BUN_NATIVE_CACHE === fingerprint) {
    require("./index.cjs");
    return;
  }

  const directory = join(tmpdir(), "canvas-bun-native", fingerprint);
  mkdirSync(directory, { recursive: true });
  await Promise.all(
    libraries.map((file) => {
      const output = join(directory, basename(file.name));
      const exists = existsSync(output) && statSync(output).size === file.size;
      return exists ? undefined : Bun.write(output, file);
    }),
  );

  const child = Bun.spawnSync({
    cmd: [process.execPath, ...process.argv.slice(1)],
    env: {
      ...process.env,
      CANVAS_BUN_NATIVE_CACHE: fingerprint,
      TEMP: directory,
      TMP: directory,
      TMPDIR: directory,
    },
    stderr: "inherit",
    stdout: "inherit",
  });
  process.exitCode = child.exitCode;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

It becomes the compiled entry point while `index.cjs` remains unchanged:

```sh
bun build bun-entry.cjs --compile --minify --bytecode \
  --asset=node_modules/canvas/build/Release --outfile dist/canvas-bun
```

## Results

| Platform                | Approach                        | Binary size | Fresh first start, median / p95 | Warm startup, median / p95 | Peak RAM |
| ----------------------- | ------------------------------- | ----------: | ------------------------------: | --------------------------: | -------: |
| macOS 26.4 ARM64        | Bun 1.4.0, direct               |   61.75 MiB |                        **FAIL** |                  **FAIL** | **FAIL** |
| macOS 26.4 ARM64        | Bun 1.4.0, extraction shim      |   80.13 MiB |            13,533 / 13,634 ms |            89.83 / 99.05 ms | 47.34 MiB |
| macOS 26.4 ARM64        | Deno 2.9.5, default             |   84.31 MiB |                        **FAIL** |                  **FAIL** | **FAIL** |
| macOS 26.4 ARM64        | Deno 2.9.5, `--self-extracting` |   84.31 MiB |            11,886 / 12,437 ms |            86.65 / 89.40 ms | 62.81 MiB |
| Debian 12 ARM64, Docker | Bun 1.4.0, direct               |   79.49 MiB |                        **FAIL** |                  **FAIL** | **FAIL** |
| Debian 12 ARM64, Docker | Bun 1.4.0, extraction shim      |  131.80 MiB |               83.99 / 143.03 ms |            27.53 / 32.72 ms | 37.51 MiB |
| Debian 12 ARM64, Docker | Deno 2.9.5, default             |  153.79 MiB |                        **FAIL** |                  **FAIL** | **FAIL** |
| Debian 12 ARM64, Docker | Deno 2.9.5, `--self-extracting` |  153.79 MiB |              132.45 / 140.14 ms |            30.05 / 31.49 ms | 54.50 MiB |

The direct rows fail while loading the first missing sibling library. Deno
turns the same binary into a working one with `--self-extracting`; Bun needs the
small extraction shim. Bun remained smaller and used less RAM. Deno was faster
on macOS, while Bun had the lower Linux median.

The public JavaScript layer is included in these measurements. The executable
loads node-canvas's module graph, patches the prototypes it normally patches,
calls `createCanvas()`, and obtains the context through the JavaScript
`Canvas.prototype.getContext` implementation before reaching C++.

## Isolated verification

On macOS, verification copied each executable to a new temporary directory and
gave it an empty application cache. It ran away from the project tree, so the
original `node_modules` was not resolvable. On Linux, verification happened in
a final Docker stage with no project or `node_modules`; it contained the
executable and Debian's `libexpat1` runtime package.

## macOS: no preparation means a slower first launch

The old sub-five-second build rewrote Mach-O dependencies to Homebrew paths and
embedded a reduced library set. This test deletes that native-preparation step.
It ships node-canvas's untouched prebuild instead: 32 sibling dylibs plus
`canvas.node`.

The price is macOS `dyld` validation for every newly materialized library. Deno
needed an 11.89-second fresh median and Bun 13.53 seconds. Once the extraction
cache existed, the medians fell to 86.65 and 89.83 ms.

## ARM64 Linux: below 144 milliseconds

The Linux run used `debian:bookworm-slim`, which resolved to Debian GNU/Linux
12. Bun and Deno came from their official ARM64 images. The Docker engine and
container both ran natively on ARM64.

The build did only the normal `bun install` before invoking each compiler.
node-canvas's Linux prebuild expects the host to provide `libexpat.so.1`, so the
final image installed Debian's 446 KB `libexpat1` package. Without it, even
Deno's correctly extracted package stops at that loader error. No node-canvas
file was copied, patched, renamed, or generated.

Bun completed a fresh launch, extraction, `require("canvas")`, native call, and
clean exit in an 83.99 ms median. Deno needed 132.45 ms. All six fresh samples
finished below 144 ms.

These measurements cover native ARM64 Debian 12 Docker on an Apple Silicon host
and glibc binaries. They demonstrate the Linux loader behavior and sub-second
outcome for that setup.

## Method

Fresh first start used three samples. Before each timed launch, the harness
copied the executable to a new directory and gave it a new extraction cache.
Timing covered process launch, materialization,
`require("canvas")`, the public JavaScript API, the C++ call, and clean exit. For
Bun, that includes the wrapper's one relaunch. The operating system's filesystem
cache remained in its current state. With three samples, p95 is effectively the
maximum.

Warm startup used ten warmups and 100 measured launches. Peak RAM is the median
maximum resident set size from 20 warm-cache runs, measured with macOS
`/usr/bin/time -l` or GNU `/usr/bin/time -v`.

## Verdict

Deno can run a real CommonJS native npm package from a compiled executable with
zero project-specific preparation: put the package under `node_modules`, write
a `.cjs` program with `require("canvas")`, and add `--self-extracting`.

Bun's direct equivalent fails because it materializes the addon without its
sibling libraries. The minimal working fallback is the extraction wrapper; it
does not inspect or rewrite native binaries, but it is still extra application
code that Deno does not need.

Bun is faster, but its executable builder seems optimized for Claude Code rather
than the boring Node.js layout that slower Deno handles without adult
supervision.

The native payload must become loadable files somewhere. macOS made that first
materialization expensive when the complete untouched prebuild was included.
ARM64 Linux made the same design fast enough to finish in about one-tenth of a
second. Bun produced the smaller, lower-RAM binary; Deno delivered the genuinely
zero-preparation build.

Thanks to Anthropic for sponsoring fast single-file JavaScript executables 😂
