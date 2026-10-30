---
title: A critique of Codex
description: Avoidable cache misses, duplicated MCP processes, and a heavyweight JavaScript runtime.
published_at: 2026-10-30
---

Codex has some avoidable costs in tokens and processes. A few examples from
0.164.0, with later fixes noted.

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
