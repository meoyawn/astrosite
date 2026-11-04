---
title: "A Self-modifying AI Agent, Part Two: Sharpening Itself"
description: >-
  SQLite, HTTP, JavaScript execution, and LLM context dumps give an agent
  evidence for improving its own harness and workflows.
published_at: 2026-11-04
---

In [part one](/writing/a-self-modifying-ai-agent-part-one-choosing-a-language/),
I wanted an agent that could inspect its own running program, edit it, and
keep going. Dart's VM Service and Flutter's widget inspector make that
possible. Traces give it a history to investigate.

Happen can export a session as Chrome Trace Event JSON. I can open it in
Perfetto; the agent can read the same file with its ordinary tools. Trace
context crosses worker isolates and WebSockets, so a tool call, its storage
operations, and its network requests remain connected on the timeline.

Three parts of that trace are particularly useful:

- **SQLite.** Statement timings and transaction boundaries expose how much
  persistence a tool call causes. The agent can investigate where commits
  belong and which writes can share a transaction. That choice also determines
  what survives a crash, so fewer commits alone cannot establish an improvement.
- **HTTP.** Connection acquisition, connection setup, response headers, and
  body streaming have separate timings. The agent can investigate repeated
  connections and opportunities to reuse them, while distinguishing transport
  overhead from time spent waiting for the model.
- **JavaScript code mode.** QuickJS runtime initialization, cell setup,
  evaluation, host tool calls, idle waits, and cleanup have separate
  measurements. Those boundaries help decide where VM isolation belongs and
  whether runtime or context reuse is worth implementing. A cell waiting on
  a browser tool should not be mistaken for JavaScript burning CPU.

The other artifact is the LLM context: instructions, tool definitions,
messages, and tool results. Happen exposes the saved context and can also
dump serialized provider requests. That lets the agent inspect what its
harness actually sends, including material the conversation UI doesn't show.

This mostly helps improve the workloads the harness runs. Repeated searches,
oversized tool results, redundant instructions, and unnecessary model
round trips become concrete things to investigate. The useful change might
be a narrower query, filtering results inside code mode, or composing several
tool calls into one program. The timeline guides harness changes; the context
helps explain how the agent approached the task.

I want the agent to run a fixed workload, inspect both artifacts, change one
thing, and run it again. Compare elapsed time and token use while checking
that the task still succeeds. Its own execution becomes evidence for its
next edit: it can point to a commit, connection, VM allocation, or tool
result that justified the change.
