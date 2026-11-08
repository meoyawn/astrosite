---
title: "A Self-modifying AI Agent, Part Two: Tracing Its Own Work"
description: >-
  Runtime diagnostics need application context. Happen records its own spans
  and exports Chrome Trace JSON to explain where an agent turn's time went.
published_at: 2026-11-04
updated_at: 2026-11-08
---

An agent can inspect its own process and still have trouble explaining why
a turn took so long. It may have spent much of that time waiting for a
model, committing to SQLite, or waiting inside a tool call. I want it to
be able to follow that time through the application.

![Conceptual illustration of a running machine unspooling a paper record of its execution, with colored timing tracks and a thread connecting related operations.](./a-self-modifying-ai-agent-part-two-sharpening-itself/tracing-its-own-work.png)

In [part one](/writing/a-self-modifying-ai-agent-part-one-choosing-a-language/),
I chose Dart and Flutter for [Happen](https://github.com/meoyawn/happen),
the agent harness I'm building. Access to the running application lets the
agent query its state while investigating a bug. Hot reload gives it a
way to apply some changes while preserving the conversation and work
already in progress.

Dart also has useful diagnostics already. Its
[CPU profiler](https://docs.flutter.dev/tools/devtools/cpu-profiler)
samples call stacks to show where the CPU spends its time, and its
[timeline API](https://api.dart.dev/dart-developer/Timeline-class.html)
can record custom events. Those capabilities are a starting point. The
history I need also has to describe the operations that matter to Happen.

Which tool call caused these database writes? Did a JavaScript cell spend
its elapsed time evaluating code or waiting for a host tool? How much of a
model request went into acquiring a connection, receiving headers, and
streaming the response? Those questions need named boundaries and a way
to follow the same work across the application. The VM cannot supply
Happen's meaning for those operations automatically.

I added [session tracing](https://github.com/meoyawn/happen/blob/4c090a10766065c2991763f62f950fbdae2c6472/packages/telemetry/README.md)
around those boundaries. A trace identity travels with the work across
the desktop/server WebSocket and worker mailboxes. Storage operations,
agent execution, and model requests inherit it. Responses carry it back
to the desktop, through applying events and presenting a frame. That
connects the history of one interaction across the places where it runs.

Three areas make the extra instrumentation useful:

- **SQLite.** Statement timings and transaction boundaries show the
  persistence caused by a tool call. That gives the agent somewhere to
  investigate repeated writes or excessive commits. Any change to
  transaction boundaries also has to preserve the intended crash behavior.
- **HTTP.** Connection acquisition, connection setup, response headers,
  and body streaming have separate timings. The agent can investigate
  transport overhead and connection reuse alongside the time spent waiting
  for the model's response.
- **JavaScript code mode.** Runtime initialization, cell setup, evaluation,
  host calls, idle waits, and cleanup are measured separately. A cell can
  remain open while a browser tool runs. Its total duration alone would
  be a poor reason to optimize JavaScript evaluation or reuse a VM.

The JavaScript measurements are elapsed times around operations in the
bridge, including conversion work. They aren't CPU measurements. The
trace supplies context for deciding what to profile more closely and
which part of the implementation to read.

I export that history as **Chrome Trace Event JSON**.
[Perfetto can open the format](https://perfetto.dev/docs/getting-started/other-formats#chrome-json-format),
so I can inspect the timeline visually. The agent can parse the same file
with its ordinary tools, find spans, compare durations, and follow related
operations. The instrumentation supplies the evidence; the export format
makes it usable outside the running application.

Tracing is opt-in per session. Happen records it locally in SQLite,
separately from conversation history, and retains it across restarts.
Export combines the desktop and server records into one file. It takes a
snapshot while the session keeps running, so unfinished operations remain
open in the exported trace. I can hand the agent a record to investigate
without stopping the work that produced it or setting up a collector.

The record deliberately leaves out prompt and output content, SQL
bindings, credentials, and HTTP headers. When a timing question leads to
what the model actually received, Happen's saved LLM context and provider
request dumps supply that separate view. A trace can locate an expensive
request; inspecting its context can help explain why it was so large.

This gives “make yourself faster” a more concrete starting point. Run a
fixed workload with tracing, identify an operation worth investigating,
read the implementation, change one thing, and run the workload again.
Compare elapsed time and token use while checking that the task still
succeeds. A shorter trace cannot establish an improvement if the agent
did less of the work it was asked to do.

Choosing a runtime gave the agent access to its living program. Adding
telemetry gives it a history with enough application context to decide
where to look next. That is the evidence I want behind its attempts to
improve the harness.
