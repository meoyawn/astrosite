---
title: "A Self-writing Agent Harness, Part One: Choosing a Language"
description: >-
  Stateful hot reload, agent-accessible runtime diagnostics, and lean native AOT
  releases: three requirements that brought me back to Flutter and QuickJS.
updated_at: 2026-10-27
published_at: 2026-10-19
---

I started with a few requirements for my own agent harness. It should support
code mode: the agent can write programs that compose tool calls. Those programs
don't have to use the harness's own language. The agent should also be able to
improve the code running it. I wanted ordinary procedures, plain data,
mainstream libraries, and as little custom reload machinery as possible.

The goal was autonomous development over a long run, on my desktop and a VPS.
If the agent discovers a bug in a tool while working, it should be able to fix
it and use the fix. That makes the development loop part of the product.

My initial assumption was that a sufficiently capable runtime could handle most
of this. Flutter had already made hot reload feel ordinary to me. I wanted to
edit the harness with the same ease while it kept its conversation, connections,
and pending work alive.

[Armin Ronacher's discussion of changing running applications](https://www.youtube.com/watch?v=HDdbU10r7Js&t=3009s)
sent me further down this path. His point about JavaScript needing deliberate
reload architecture stuck with me. So did the distinction between restoring
saved state and preserving a running program. A conversation log doesn't
recreate an open stream or a procedure halfway through its work.

<iframe class="aspect-video h-auto w-full" width="560" height="315" src="https://www.youtube-nocookie.com/embed/HDdbU10r7Js?start=3009" title="Armin Ronacher on changing running applications while preserving state" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Three pillars, at different points in the cycle

Hot reload was only the first requirement. What I actually wanted was a runtime
that took all three parts of the development and release cycle seriously:

1. **Change the running program.** Stateful hot reload during development,
   without throwing away the conversation, connections, and pending work every
   time the agent edits a tool. A file watcher that restarts the process isn't
   the same thing.
2. **Inspect the running program.** Excellent official CLI tools or an MCP
   server, so the agent can investigate what it just changed: start and stop
   a performance recording, collect CPU profiles and timeline traces, capture
   a heap, and follow retained objects when memory keeps growing. For a GUI,
   that should extend to the actual widget and accessibility structure, not
   just a screenshot. These need to be callable tools, not a workflow that
   depends on me clicking through an IDE.
3. **Ship a lean native binary.** Ahead-of-time compilation for release, without
   carrying the development compiler and JIT into every deployment. The GC and
   whatever runtime support the application needs can stay. AOT doesn't mean
   there is no runtime; it means I don't need a compiler on the user's machine
   to execute the host application.

These are three stages, not three things I expect one production process to do
at once. Develop with hot reload. Find a regression or a leak and inspect the
live process. Then build and measure the AOT release. I don't need the shipped
AOT binary to hot reload its own native code.

That combination matters more to me than winning a language benchmark. An
agent that can edit a function but can't inspect its consequences has only
half a development loop.

## Looking for live updates

I initially expected BEAM to settle the question. Erlang was built for upgrading
running systems. Its
[code-loading model](https://www.erlang.org/doc/system/code_loading.html) really
does allow old and new code to coexist. But execution can remain in old code,
and changing the meaning of existing state can require explicit upgrade
coordination. I wanted the agent making ordinary source edits, without
maintaining an application-level versioning protocol.

Lisp and Smalltalk were tempting for the same reason: live programming is
central to their environments. I set them aside because I wanted a more
mainstream application ecosystem. That was a project preference, not a benchmark
result. Go lacked the first-party live-patching workflow I wanted;
Rust/Subsecond brought compilation and data-layout constraints back into the
decision.

The JVM does have live updates. Standard
[HotSwap](https://docs.oracle.com/en/java/javase/25/docs/api/jdk.jdi/com/sun/jdi/VirtualMachine.html#redefineClasses(java.util.Map))
can replace method bodies without rebuilding the application's state. Active
stack frames finish the old method; subsequent calls use the replacement.
Ordinary HotSpot HotSwap is more restrictive about structural changes, such as
adding fields or methods, than that description might suggest. That is a real
reload workflow, with boundaries to test rather than a reason to dismiss the
whole platform.

AOT is coming to the standard JVM too: Project Leyden's
[ahead-of-time code compilation](https://openjdk.org/jeps/544) is targeted for
[JDK 28 in March 2027](https://www.jcp.org/en/jsr/detail?id=403). It caches native
code from a training run while retaining the JIT. That is useful progress, but
it is a different deployment model from the lean, no-JIT release binary I want.

Then JavaScript complicated things. Vite makes editing applications feel
effortless, so why assume server code couldn't get the same treatment? Node's
built-in [watch mode](https://nodejs.org/api/cli.html#--watch) restarts the
process, but
[Vite supports server-side HMR in Node](https://vite.dev/guide/api-environment-runtimes).
Bun also keeps a process alive during hot reload. The question became which
state, callbacks, and resources would actually pick up a change.

I nearly dismissed Vite for needing application glue. That was too quick. It
doesn't require manually versioning the application. Its normal
[HMR API](https://vite.dev/guide/api-hmr) provides acceptance and disposal
hooks. Still, a function already handed to another part of the program can keep
executing its old implementation.

## What actually changed after a reload

I tested that directly with small procedural servers: free functions, dictionary
state, registered callbacks, a suspended async procedure, and live WebSocket and
SSE connections. I used Dart 3.13.5, .NET SDK 10.0.402, and Node 26.12.0 with
Vite 8.2.2. Vite used an ordinary HMR acceptance callback, without an
application-level versioning protocol.

| After editing the source                      | Dart VM   | .NET / C#                         | Node + Vite  |
| --------------------------------------------- | --------- | --------------------------------- | ------------ |
| Previously registered named function callback | Updated   | Updated                           | Old function |
| Existing captured closure body                | Old body  | Updated body                      | Old body     |
| Procedure suspended at an await               | Old body  | Updated continuation in this edit | Old body     |
| Original WebSocket and SSE connections        | Preserved | Preserved                         | Preserved    |

These were development-runtime probes, not tests of AOT deployment.

That made .NET more interesting than I expected. Its updated closure still held
its previously captured data; changing code hadn't recreated the past. Dart's
old async body could call newly updated named functions. Vite's old procedure
continued calling functions from its old module.

Speed didn't settle it either. Earlier small-fixture tests measured warm reload
medians of about 26 ms for Dart, 51 ms for .NET, and 14 ms for Vite with a tuned
watcher; default Vite was about 101 ms. The tuned watcher missed an immediate
successive edit, so the passing runs spaced writes by 120 ms. These were
twenty-edit local macOS measurements, leaving long-run reliability unproven.

There were less pleasant findings too. Our .NET watch setup restarted or
suspended reloading on unsupported edits. Dart 3.13.5 hit a reproducible VM
crash during a structural edit. Cleanup needed explicit attention in every
runtime: timing out a wait didn't stop the underlying work.

## Inspecting the process I just changed

The second pillar is just as important as hot reload. If an edit makes a tool
slow or leaves objects alive, I want the agent to examine the running process
without restarting away the evidence.

Flutter is unusually appealing here. The official
[Dart and Flutter MCP server](https://github.com/dart-lang/ai/blob/main/pkgs/dart_mcp_server/README.md)
exposes hot reload, runtime errors, widget inspection, and a bridge into the
VM Service. [DevTools](https://docs.flutter.dev/tools/devtools) and the underlying
[VM Service](https://github.com/dart-lang/sdk/blob/main/runtime/vm/service/service.md)
provide CPU profiles, timeline traces, heap snapshots, and retaining paths.
Flutter also exposes its
[semantics tree](https://docs.flutter.dev/testing/code-debugging) for inspecting
accessibility. I want
the agent to reason about the application as a running system, including its
UI, rather than guessing from source code and screenshots.

The interfaces still differ: widget inspection, semantics dumps, and streamed
heap snapshots need different handling. An agent needs adapters for those raw
APIs; the MCP isn't yet a turnkey interface to every DevTools feature. But the
runtime evidence is there.

.NET belongs in this comparison too. An application launched by
[`dotnet watch`](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-watch)
is still a live .NET process. The
[official diagnostic tools](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/)
can attach to the application's PID: `dotnet-trace` for recordings,
`dotnet-gcdump` for a managed heap graph, and `dotnet-dump` for a process dump
and analysis. I don't have to stop using hot reload to collect that evidence.
These are companion CLIs, not profiling commands built into `dotnet watch`.

There are practical limits: target the app, not the watcher; an unsupported
edit can restart it and change its PID. Heap collection can trigger a GC and
pause execution. And a profile of the development process helps explain a
regression, but doesn't replace measuring the release build. Still, .NET has
both the live-editing and live-inspection sides of the loop. Flutter's
integrated UI tooling is a reason for my preference, not evidence that .NET
can't diagnose a running application.

## Code mode and the AOT problem

Code mode brought me back to another prerequisite: running programs written by
the agent, with a chosen tool API. JavaScript has direct options such as Node's
[`vm.Script`](https://nodejs.org/api/vm.html). C# surprised me again:
Microsoft's
[Roslyn scripting APIs](https://github.com/dotnet/roslyn/blob/main/docs/wiki/Scripting-API-Samples.md)
can compile and execute snippets through `CSharpScript.EvaluateAsync`, with
host-supplied objects available to the script on the normal JIT-capable .NET
runtime. Dart has no ordinary built-in eval. Its
[VM service evaluates expressions](https://github.com/dart-lang/sdk/blob/main/runtime/vm/service/service.md#evaluate),
and in JIT mode
[`Isolate.spawnUri`](https://api.dart.dev/dart-isolate/Isolate/spawnUri.html)
can run a script file in a separate isolate. Those are different execution
paths. At this point, I'd tested live edits but still hadn't proved how I'd
ship code mode.

Deployment exposed another assumption. Native AOT was a requirement for the
host, not a packaging detail to figure out later. Native
desktop apps can use just-in-time (JIT) compilation; my Flutter debug app
already does. But standard Flutter
[release builds use AOT](https://docs.flutter.dev/testing/build-modes).
Adding a separate JIT executable wouldn't enable `evaluate` inside the AOT app.

There was also a compiler to account for. Flutter currently
[routes expression compilation through its resident tool compiler](https://github.com/flutter/flutter/blob/master/packages/flutter_tools/lib/src/run_hot.dart).
For this Dart design, I'd need to package JIT plus expression compilation for
both desktop and VPS. On macOS, JIT also needs the appropriate
[signing entitlement](https://docs.flutter.dev/add-to-app/macos/project-setup).
That moved Dart down my list. I wanted an AOT host, and now the
dynamic Dart path needed both a runtime and a compiler packaged alongside the
app. The development experience alone hadn't answered the deployment question.

C# then ran into the same deployment question. Roslyn's scripting engine
[emits a managed assembly and loads it at runtime](https://github.com/dotnet/roslyn/blob/main/src/Scripting/Core/ScriptBuilder.cs).
.NET Native AOT
[doesn't support dynamic managed-assembly loading or runtime code generation](https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/#limitations-of-native-aot-deployment).
That rules out `CSharpScript.EvaluateAsync` inside a Native AOT executable.
[ReadyToRun retains a JIT](https://learn.microsoft.com/en-us/dotnet/core/deploying/ready-to-run),
so it doesn't give me a JIT-free deployment either. A Native AOT host could
delegate scripts to a separate JIT process, but I'd then have another runtime
and a process boundary to package and manage. Roslyn scripting doesn't give
.NET an AOT advantage over Dart.

TypeScript's release story is changing too. Bun has an experimental
[native-AOT pull request](https://github.com/oven-sh/bun/pull/45631) that compiles
JavaScript and TypeScript to machine code without a JIT, with Claude Code
already used as a test case. This is the new AOT work, not simply bundling a
runtime into a single executable. The
[engine work](https://github.com/oven-sh/WebKit/pull/757) has merged; the Bun
integration is still unmerged as I write this. I expect TypeScript AOT to become
a practical option in late 2026 or early 2027, but that is my expectation, not
an announced release date.

That could change this comparison considerably. It still ships Bun's runtime,
and dynamically generated code takes an interpreted path. For this harness,
that distinction is useful: a native-compiled host and an interpreter for
agent-written programs is close to the architecture I was arriving at anyway.
The experimental implementation and its compatibility limits need testing;
the existence of AOT doesn't by itself settle reload semantics or packaging.

## Getting code execution into the host process

So I tried packaging Dart directly. The first proof was an AOT CLI with a
compressed JIT runtime embedded in its executable. It accepted a Dart
expression, extracted the runtime, and ran the expression in a child process.
It returned `42` for a small function declaring `const something = 21` and
returning `something * 2`. That established single-file distribution, but I
wanted code mode inside the host process, close to the agent loop and its tools.

Then I tried [FJS](https://pub.dev/packages/fjs), which embeds
[QuickJS](https://bellard.org/quickjs/) through Rust and Dart FFI. With its
package metadata adapted for pure Dart, I built another AOT CLI. It embedded
the native library, extracted it at startup, and evaluated JavaScript in the
host process. An awaited JavaScript-to-Dart bridge call returned the host's
PID. Constants, arithmetic, and promises worked without an installed SDK.

QuickJS looked like the obvious winner. But I'd given the Dart proof a process
boundary and the QuickJS proof an embedding API. I still needed to find out
whether Dart could execute inside the AOT host too.

It could. A small C++ bridge loaded a separate JIT-capable Dart VM into the
AOT process, on a native thread. The first version ran a kernel file compiled
before launch. Completing the expression-to-result path meant packaging the
compiler as well: an AOT compiler snapshot ran in another isolate group in
the host VM, compiled the new source into kernel, and handed that to the
embedded JIT VM. A native callback copied the result back to the AOT host.
The two VMs had separate heaps in the same address space.

The resulting executable accepted new expression strings after launch and
returned their results with child processes prohibited and access to the
installed SDK blocked. It handled the constant example, collections,
microtask futures, and compilation and runtime errors. Same-process Dart
execution was possible; my first implementation simply hadn't gone far enough.
The embedding still depended on private scheduling hooks and only established
one evaluation per CLI launch on macOS ARM64.

## Measuring Dart JIT against QuickJS

Now I could compare two complete pipelines. Both hosts were Dart 3.13.5 AOT
executables; the JavaScript version used FJS 3.3.2. Each shipped as one file
and extracted its embedded runtime assets into a temporary directory. The
Dart version also carried its compiler and platform kernel.

On an M1 Pro with 16 GiB RAM and macOS 26.4, I ran 100 fresh launches of each
CLI. Each expression performed 100 rounds of 10,000 modular multiply updates:
`x = (x * 48271) % 2147483647`, with a different starting value per round.
Both returned the same checksum, `1966450964`; the arithmetic stayed within
JavaScript's exact-integer range. These are medians, except the P95 row.

| Property | AOT host + Dart JIT | AOT host + FJS / QuickJS |
| --- | ---: | ---: |
| Distributable executable | 38.0 MiB | 11.3 MiB |
| Extracted runtime and compiler assets | 62.6 MiB | 7.1 MiB |
| Full arithmetic pipeline | 458 ms | 181 ms |
| Full arithmetic pipeline, P95 | 523 ms | 189 ms |
| Arithmetic execution alone | 6.25 ms | 122 ms |
| Peak process RAM during the pipeline | 249.5 MiB | 52.9 MiB |
| Trivial `6 * 7` pipeline, 20 launches | 450 ms | 58.5 ms |

The full pipeline ran from process launch through extraction, source
compilation, execution, result transfer, cleanup, and exit. Runs were serial,
alternating engine order, with warm filesystem caches. Peak RAM included the
host, compiler, and execution runtime. The arithmetic timer excluded setup
and source compilation, but included first execution and any JIT optimization
during the loop. These measurements describe fresh CLI processes; I hadn't
measured repeated evaluations inside a resident app.

QuickJS was quick where this design needed it: startup, packaging, and memory.
Dart executed the arithmetic about 19.5 times faster, while QuickJS returned
the complete result about 2.5 times faster. The Dart prototype spent roughly
234 ms unpacking assets and 115 ms compiling source. That made the tradeoff
concrete. For code mode that mostly composes tool calls, QuickJS looked like
the more attractive starting point. I'd still need to measure actual agent
programs, including bridge calls and I/O.

## How much machinery am I shipping?

The memory tradeoff wasn't abstract. In this screenshot from my desktop, the
ChatGPT process group is using 7.48 GB of RAM and 1,262 threads. Many of its
child `node` processes are using around 80 MB each.

![Process monitor showing the ChatGPT process group using 7.48 GB of RAM and 1,262 threads, with numerous child Node.js processes.](./codex-memory-usage.png)

That's a snapshot of a complete desktop application, not a comparison of
JavaScript engines. It doesn't tell me how much memory its code execution
accounts for. But it does help explain why I wanted a small embedded
interpreter: I didn't want every tool program to need another runtime process.
The QuickJS measurements gave me a concrete reason to pursue that design.

Then I checked the installed Codex CLI itself. Version 0.163.0 on macOS ARM64
was almost 250 MB for the executable alone. That startled me. By then, I'd
started a larger, still partial Dart CLI using this design. Its AOT executable,
with the native payload bundled inside it, was 12.86 MB.

I measured thirty warm `--version` launches of each, after three warmups,
alternating their order. These sizes use decimal MB, unlike the MiB in the
earlier prototype comparison.

| Property | Codex CLI 0.163.0 | Partial Dart AOT CLI |
| --- | ---: | ---: |
| Executable size | 249.95 MB | 12.86 MB |
| Warm startup, median | 12.03 ms | 18.94 ms |
| Warm startup, P95 | 12.61 ms | 21.97 ms |
| Peak resident memory, median | 20.22 MB | 15.29 MB |
| Peak physical footprint, median | 9.00 MB | 5.15 MB |

The physical-footprint figures came from five separate runs per executable.
The first Dart launch with an empty native cache took 181 ms, peaked at
64.47 MB of resident memory, and created a 10.07 MB cache. That was a fresh
native cache, not a cold operating-system cache. Once the cache existed,
Codex was faster to print its version; my executable was much smaller.

I don't yet know what accounts for Codex's executable size. I haven't
established whether it bundles Node.js, or how much any particular dependency
contributes. QuickJS's own [size example](https://bellard.org/quickjs/) is
367 KiB of x86 code for a simple hello-world program. That isn't the size of
my ARM64 FJS bundle, but it helped reset my expectations for what embedding a
JavaScript engine has to cost. My actual FJS library was 7.44 MB before
compression; its compressed payload was already part of that 12.86 MB
executable.

My CLI was still partial, and printing a version doesn't exercise a running
agent session. Neither this table nor the desktop screenshot establishes a
like-for-like agent comparison. Still, almost 250 MB was hard to shrug off.
I had started by wondering which language could change its own running code;
now I was also wondering how much machinery I actually needed to ship.

## Coming back to Flutter

That brought me back to Flutter with a different architecture in mind. I could
have a desktop app whose Dart agentic loop runs inside the app process, with
QuickJS in that same process for agent-written tool programs. JavaScript could
await tool calls through an explicit bridge; Dart could own the conversation,
connections, and UI state. The same Dart loop could also run headlessly on a
VPS, although Linux packaging still needed its own proof.

I like that combination: a Flutter desktop UI, an in-process agent loop, and
in-process QuickJS, alongside the state-of-the-art hot-patching and reloading
workflow that drew me to Flutter. Its
[stateful hot reload](https://docs.flutter.dev/tools/hot-reload) could let me
edit the Dart UI and harness during development while keeping their live
state. QuickJS would handle code mode without making dynamic Dart compilation
a requirement for every deployment.

The build modes still mattered. Flutter's Dart hot reload works in debug
mode. An AOT release could keep the Dart host compiled and evaluate new
JavaScript through QuickJS. Updating that Dart host while it runs would still
require a separate deployment decision. Evaluating replacement JavaScript
would also need deliberate handling of existing callbacks and state, just as
the earlier Vite experiment showed. Embedding an evaluator hadn't solved
every live-patching problem.

I'm thinking of semi-trusted tool programs here. I still need to decide what
they can access and how to stop them. A separate execution context doesn't
automatically supply a security boundary: Node explicitly documents that its VM
module is not a security mechanism. The Dart and QuickJS proofs ran inside
their hosts' address spaces. I still needed explicit capabilities, resource
limits, and cancellation for the agent's programs.

Flutter with a Dart harness and QuickJS code mode is now the direction I want
to explore. .NET reached further into closures and suspended procedures in
the reload probes, and Vite remains a credible option. But the harness and its
tool programs can use different languages, as I'd allowed at the beginning.
That gives me a way to keep all three pillars: Flutter's live development
experience, runtime inspection the agent can use, and native AOT deployment,
with a small interpreter for dynamic programs. The UI ecosystem is also a
product choice: .NET has cross-platform frameworks, but Flutter is the stack
I want to build on.
The next question is whether that combination holds up while an agent changes
its own tools over a long run.

## Still amazed by Go and Dart

One thing I still can't get over: Google absolutely nailed both Go and Dart.
The engineering, the developer experience—it's insane. I've spent my whole
life avoiding both languages, and it turns out they're excellent to work with.
I don't know, man. After all these experiments, I'm still amazed.
