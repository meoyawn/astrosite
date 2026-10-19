---
title: "A Self-writing Agent Harness, Part One: Choosing a Language"
description:
  I wanted a long-running agent to improve its own harness. Testing Dart, .NET,
  and JavaScript made the language choice harder.
updated_at: 2026-10-19
---

I started with a few requirements for my own agent harness. It should support
code mode: the agent can write programs that compose tool calls. Those programs
don't have to use the harness's own language. The agent should also be able to
improve the code running it. I wanted ordinary procedures, plain data,
mainstream libraries, and as little custom reload machinery as possible.

The goal was autonomous development over a long run. If the agent discovers a
bug in a tool while working, it should be able to fix it and use the fix. That
makes the development loop part of the product.

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
decision. I excluded the JVM on personal preference.

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

Code mode brought me back to another prerequisite: running programs written by
the agent, with a chosen tool API. JavaScript has direct options such as Node's
[`vm.Script`](https://nodejs.org/api/vm.html). C# surprised me again:
Microsoft's
[Roslyn scripting APIs](https://github.com/dotnet/roslyn/blob/main/docs/wiki/Scripting-API-Samples.md)
can compile and execute snippets through `CSharpScript.EvaluateAsync`, with
host-supplied objects available to the script. Dart has no ordinary built-in
eval. Its
[VM service evaluates expressions](https://github.com/dart-lang/sdk/blob/main/runtime/vm/service/service.md#evaluate),
and in JIT mode
[`Isolate.spawnUri`](https://api.dart.dev/dart-isolate/Isolate/spawnUri.html)
can run a script file in a separate isolate. Those are different execution
paths, whose startup cost and cleanup I haven't compared yet.

I'm thinking of semi-trusted tool programs here. I still need to decide what
they can access and how to stop them. A separate execution context doesn't
automatically supply a security boundary: Node explicitly documents that its VM
module is not a security mechanism. Dart's separate isolate heap and C#'s
scripting API also don't, by themselves, establish filesystem or network
restrictions. That leaves capability, isolation, and cancellation as distinct
questions alongside hot reload.

I haven't chosen a language. Dart gives me a familiar development loop, .NET
reached further into running code in these probes, and Vite remains a credible
option with more responsibility at its reload boundaries. I started by looking
for the strongest hot reload. I'm now trying to understand which limitations an
agent can work with reliably over a long run.
