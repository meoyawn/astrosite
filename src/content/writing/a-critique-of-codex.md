---
title: A critique of Codex
description: Avoidable cache misses, duplicated MCP processes, a heavyweight JavaScript runtime, and uneven cancellation.
published_at: 2026-10-30
---

Codex has some avoidable costs in tokens and processes, and some surprising
cancellation behavior. A few examples from 0.164.0, with later fixes and
0.166.0 cancellation behavior noted.

## Prompt cache preservation was opt in

Preserving the prompt prefix when changing reasoning effort on supported
models required `reasoning_effort_override = true`. Upstream fixed
the default in [0.165.0, released October 27](https://github.com/openai/codex/releases/tag/rust-v0.165.0).

## Compaction needlessly changes the cache prefix

After a reasoning-effort change, compaction
[resets the request-level baseline to the selected effort, still in 0.166.0](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/session/reasoning_effort.rs#L35-L40).
That changes the prompt prefix again.
OpenAI's [own guidance](https://developers.openai.com/api/docs/guides/reasoning#change-reasoning-mid-conversation)
says to keep that baseline unchanged and append a fresh configuration update
after compaction.

Maybe this cache reset is just sloppy engineering. API-key users
[pay more for uncached input](https://developers.openai.com/api/docs/models/gpt-6-luna),
but that alone proves nothing about intent.

## MCP subprocesses multiply with conversations

Each conversation's MCP runtime can
[launch another copy of the same configured local stdio server](https://github.com/openai/codex/blob/rust-v0.164.0/codex-rs/rmcp-client/src/stdio_server_launcher.rs#L199-L214).
Each copy has its own startup work, heap and connection state.

Sharing suitable servers across conversations would avoid that duplication.
Approvals and request ownership can still stay separate.

## Code mode carries a separate V8 runtime

The local path [starts a standalone JavaScript host](https://github.com/openai/codex/blob/rust-v0.164.0/codex-rs/code-mode/src/remote_session.rs#L37-L86),
shared across sessions, and sends execution requests and tool callbacks
over pipes. It also brings [V8 and ICU dependencies](https://github.com/openai/codex/blob/rust-v0.164.0/codex-rs/code-mode-runtime/Cargo.toml).
That's a lot of machinery for short snippets mostly calling tools and
processing JSON.

An embedded interpreter could remove the extra process and IPC, at the
cost of the separate process boundary.

## Steering leaves work running

In 0.166.0, steering a conversation signals preemption, but code mode uses
that signal to [yield control](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/code-mode-runtime/src/service.rs#L66-L82).
The JavaScript cell stays alive, along with tools it has already dispatched.
The agent can read the new instruction while earlier work continues.

An explicit interrupt goes further: it
[cancels the turn and terminates active cells](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/tasks/mod.rs#L977-L989)
when `code_mode_interrupt` is enabled, as it is by default. Cell cancellation
propagates to nested tool calls. But cancelling the local call still does
not guarantee that the underlying work stops.

For MCP tools, Codex [sends a cancellation notification](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/rmcp-client/src/request_cancellation.rs#L40-L54)
when the response future is dropped. The server has to honor it.
For bash and other shell commands, the
[resumable execution path stores the process independently](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/unified_exec/process_manager.rs#L610-L648),
so it can survive a turn or cell interrupt. The separate
[one-shot path does terminate its process on cancellation](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/unified_exec/oneshot.rs#L75-L94).

Keeping a development server alive is useful. Leaving a command running
after the user stops its turn is a different expectation. These lifetimes
should be visible, with a way to cancel work belonging to the turn while
preserving processes the user deliberately wants to keep.
