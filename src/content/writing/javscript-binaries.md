---
title: Single file JavaScript binaries with C++ dependencies
description: Bun and Deno package require("canvas") and its C++ addon into one executable
published_at: 2026-08-28
---

I wanted to turn a JavaScript server into one executable. It had
to use [`node-canvas`](https://github.com/Automattic/node-canvas), call its C++
N-API addon, and return the correct pixel. Each executable supplied its own
packaged copy of node-canvas.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">To make Claude Code start faster, source code is parsed ahead of time into bytecode. <br><br>Bytecode in the binary was about 9x larger than source code. After several optimizations to JavaScriptCore&#39;s bytecode serialization format &amp; Bun&#39;s bundler, now it&#39;s 2.6x <a href="https://t.co/F98JaeUCOu">pic.twitter.com/F98JaeUCOu</a></p>&mdash; Jarred Sumner (@jarredsumner) <a href="https://x.com/jarredsumner/status/2092809441892774296?ref_src=twsrc%5Etfw">August 27, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

I compared [Bun's compiled executables](https://bun.com/docs/bundler/executables),
[`deno compile`](https://docs.deno.com/runtime/reference/cli/compile/), and
[`scriptc`](https://github.com/vercel-labs/scriptc) on macOS ARM64 and native
ARM64 Linux in Docker.

## How one file contains a native npm package

A `.node` addon is a shared library. Bun and Deno embed arbitrary files, while
the operating-system loader loads node-canvas and its dependent libraries from
materialized files.

The build therefore embeds one payload containing:

- the CommonJS test program;
- node-canvas's untouched `index.js`, `lib/*.js`, and `package.json`;
- `canvas.node` and the required dylibs or ELF shared libraries; and
- a content hash covering every packaged file.

On first launch, a small loader materializes the payload into a temporary cache
with this ordinary Node.js layout:

```text
app.cjs
node_modules/
  canvas/
    index.js
    lib/
    build/Release/canvas.node
```

It then executes `app.cjs`. Standard CommonJS resolution makes its literal
`require("canvas")` find the packaged module. Later launches reuse the
content-addressed cache.

This produces a single-file distribution: native libraries ship inside the
executable and materialize into the cache at runtime.

## Deno can run require("canvas")

Yes, Deno can run this CommonJS program. The test and payload loader use the
explicit `.cjs` extension, which selects Deno's
[CommonJS compatibility](https://docs.deno.com/runtime/fundamentals/node/#commonjs-support).
The upstream node-canvas `.js` files then use their own unchanged `require()`
calls, including `require("../build/Release/canvas.node")`.

The working builds are:

```sh
bun scripts/prepare-native.mjs
bun build src/canvas-native-bun.cjs --compile --minify --bytecode \
  --asset .native --outfile dist/canvas-bun
```

```sh
bun scripts/prepare-native.mjs
deno compile --allow-ffi --allow-read --allow-write --allow-env --no-npm \
  --include .native --output dist/canvas-deno src/canvas-native.cjs
```

## Results

| Platform                | Approach              | Binary size | Fresh first start, median / p95 | Warm startup, median / p95 | Peak RAM | Result   |
| ----------------------- | --------------------- | ----------: | ------------------------------: | --------------------------: | -------: | -------- |
| macOS 26.4 ARM64        | Bun 1.4.0              |   68.46 MiB |              4,221 / 4,223 ms |            76.99 / 79.95 ms | 51.73 MiB | **PASS** |
| macOS 26.4 ARM64        | Deno 2.9.5             |   71.83 MiB |              4,360 / 4,371 ms |            80.13 / 84.92 ms | 62.97 MiB | **PASS** |
| macOS 26.4 ARM64        | scriptc 0.0.35 via Nub |    1.75 MiB |                        **FAIL** |                  **FAIL** | **FAIL** | **FAIL** |
| Debian 13 ARM64, Docker | Bun 1.4.0              |  131.17 MiB |                   85.96 / 102.33 ms |            14.85 / 16.39 ms | 38.75 MiB | **PASS** |
| Debian 13 ARM64, Docker | Deno 2.9.5             |  152.43 MiB |                   98.33 / 100.72 ms |            27.53 / 29.43 ms | 55.42 MiB | **PASS** |
| Debian 13 ARM64, Docker | scriptc 0.0.35 via Nub |    **FAIL** |                        **FAIL** |                  **FAIL** | **FAIL** | **FAIL** |

Bun was smaller and had the lower median startup and RAM use in both
environments. Deno's three Linux first launches were slightly more consistent,
giving it a 100.72 ms p95 versus Bun's 102.33 ms. Both are effectively
one-tenth-of-a-second first starts on this ARM64 Linux setup.

The public JavaScript layer is included in these measurements. The executable
loads node-canvas's module graph, patches the prototypes it normally patches,
calls `createCanvas()`, and obtains the context through the JavaScript
`Canvas.prototype.getContext` implementation before reaching C++.

## Isolated verification

On macOS, verification copied each executable to a new temporary directory,
removed its application cache, renamed the project's `node_modules` out of
reach, and ran the copy. On Linux, verification happened in a clean final
Docker stage containing the executable. The executable supplied the JavaScript
package, addon, and Expat library.

## macOS: below five seconds, with a catch

The macOS build inspects the 33 node-canvas Mach-O files, redirects 23
compatible libraries to
`/opt/homebrew/lib`, and embeds only `canvas.node` plus nine dylibs. Those ten
files are signed before being placed in the executable.

That got the public-API test to 4.22 seconds with Bun and 4.36 seconds with
Deno. Sampling earlier slow launches put them in `dyld` code-signature
validation. The 77–80 ms warm medians show how much work disappears once the
materialized native files have already been accepted and cached.

The catch is important: these smaller macOS executables are host-dependent.
They load the expected Homebrew libraries alongside the ten embedded native
files.

## ARM64 Linux: below 103 milliseconds

The Linux run used
[`ghcr.io/nubjs/nub:0.7.5-slim`](https://nubjs.com/docs/deployment/docker),
which resolved to Debian GNU/Linux 13. Bun and Deno came from their official
ARM64 images. The Docker engine and container both ran natively on ARM64.

The builder added `libexpat.so.1` to node-canvas's prebuilt Cairo stack. The
final payload contained 28 native files, plus the public JavaScript package and
test program.

Bun completed a fresh launch, extraction, `require("canvas")`, native call, and
clean exit in an 85.96 ms median. Deno needed 98.33 ms. Both stayed below 103 ms
even at the three-sample p95.

These measurements cover native ARM64 Debian 13 Docker on an Apple Silicon host
and glibc binaries. They demonstrate the Linux loader behavior and sub-second
outcome for that setup.

## scriptc still fails

The earlier scriptc adapter already used the public node-canvas API. It compiled
through `nub dlx scriptc@0.0.35`, but its runtime failed before
`createCanvas()`:

```text
scriptc binaries cannot load .node addons (the island has no process.dlopen)
```

That `process.dlopen` failure produced the **FAIL** rows in the table.

## Method

Fresh first start used three samples. Before each timed launch, the harness
copied the executable to a new directory and removed its content-addressed
application cache. Timing covered process launch, payload materialization,
`require("canvas")`, the public JavaScript API, the C++ call, and clean exit. The
operating system's filesystem cache remained in its current state. With three
samples, p95 is effectively the maximum.

Warm startup used ten warmups and 100 measured launches. Peak RAM is the median
maximum resident set size from 20 warm-cache runs, measured with macOS
`/usr/bin/time -l` or GNU `/usr/bin/time -v`.

## Verdict

Deno can run a real CommonJS native npm package from a compiled executable.
The simple form works: put the package under `node_modules`, execute a `.cjs`
program, and call `require("canvas")`.

The native payload still needs to become loadable files, so the executable
extracts it into a cache on first launch. macOS made that launch expensive even
after a host-dependent dylib reduction. ARM64 Linux made the same design fast
enough to finish in about one-tenth of a second. Bun won most measured metrics,
Deno worked correctly through the same public API, and scriptc stopped at N-API
loading.

Thanks to Anthropic for sponsoring fast single-file JavaScript executables 😂
