---
title: "Tool search: how AI harnesses load tools on demand"
description: Codex, Claude Code, Grok Build, OpenCode, OpenClaw, Pi, eve, DeepSeek Harness, and Happen take different routes to smaller tool catalogs.
published_at: 2026-10-31
---

Connecting another MCP server should not require the model to read another
hundred function definitions before answering a question. Deferred tool discovery
keeps the full catalog available to the harness and brings individual tools
into the model's context when they become relevant.

There are two useful approaches. **Native loading** makes a discovered tool
directly callable by the model. **Documentation retrieval** returns its
signature as ordinary tool output; the model then invokes it through code or a
generic dispatcher. Both spend context on discovered definitions. They differ
in how those definitions become usable.

In July 2023,
[ToolLLM](https://arxiv.org/abs/2307.16789) included a retriever that
selected APIs for an instruction. Anthropic
[introduced MCP in November 2024](https://www.anthropic.com/news/model-context-protocol),
making integrations easier to connect. Harnesses control how much of each
integration's tool catalog reaches the model.

Cloudflare described
[Code Mode on September 26, 2025](https://blog.cloudflare.com/code-mode/):
present APIs as TypeScript and let the model compose calls in code. Anthropic's
[November 4, 2025 post](https://www.anthropic.com/engineering/code-execution-with-mcp)
described reading tool definitions on demand or finding them with
`search_tools`. Its
[November 24, 2025 release](https://www.anthropic.com/engineering/advanced-tool-use)
added API-level tool search and `defer_loading`.

[Claude Code 2.1.7, released January 14, 2026](https://github.com/anthropics/claude-code/releases/tag/v2.1.7),
enabled automatic MCP tool search when definitions exceeded 10% of the context
window. Its [current documentation](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search)
describes deferral by default on supported configurations, with that threshold
available as an optional mode.

The implementations now make different choices:

| Harness | Initially visible | Discovery and invocation |
| --- | --- | --- |
| [Codex](https://github.com/openai/codex) | Core tools and bounded summaries of deferred namespaces. | [Local BM25 search](https://github.com/openai/codex/blob/67f0994b532b8740f14b5b738af7b7b2a915b1d6/codex-rs/core/src/tools/handlers/tool_search.rs) supports both paths: native `tool_search_output` loads schemas; code-mode search returns callable names and TypeScript declarations. |
| [Claude Code](https://github.com/anthropics/claude-code) | In the inspected mirror, deferred tools are announced by name; their parameter schemas stay deferred. | The [mirrored implementation](https://github.com/codeaashu/claude-code/blob/b983a3b8106bf77cbae6d439f700cc74d74ccd15/src/tools/ToolSearchTool/ToolSearchTool.ts) uses weighted keyword matching or exact `select:` queries. Results contain `tool_reference` blocks that load definitions for direct calls. |
| [Grok Build](https://github.com/xai-org/grok-build) | [Local mode](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-shell/src/session/acp_session_impl/sampler_turn.rs#L432) exposes built-in tools and MCP server summaries; individual integration schemas stay in the host catalog. | [`search_tool`](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/implementations/search_tool/mod.rs) returns matching names, descriptions and input schemas as JSON tool output, with five results by default. The index tries exact tool names before BM25. [`use_tool`](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/implementations/use_tool/mod.rs) dispatches calls by qualified name; search leaves the native tool list unchanged. |
| [OpenCode](https://github.com/anomalyco/opencode) | A [partial code-mode catalog](https://github.com/anomalyco/opencode/blob/173f6c6dce7db669679625f6af93651ae66f16be/packages/core/src/codemode/catalog.ts), plus namespace summaries. | [`search`](https://github.com/anomalyco/opencode/blob/173f6c6dce7db669679625f6af93651ae66f16be/packages/codemode/src/tool-runtime.ts) returns descriptions and typed signatures, with namespace filtering and pagination. Calls run through code mode. |
| [OpenClaw agent-core](https://github.com/openclaw/openclaw/tree/main/packages/agent-core) | The core forwards the host's [`context.tools`](https://github.com/openclaw/openclaw/blob/7992b413a8b524c0a29c5b86e4e50c057a777a3a/packages/agent-core/src/agent-stream-response.ts#L201); OpenClaw's outer harness manages discovery controls and a bounded directory. | Host [`tool_search` and `tool_describe`](https://github.com/openclaw/openclaw/blob/7992b413a8b524c0a29c5b86e4e50c057a777a3a/src/agents/tool-search-runtime.ts) provide BM25 discovery, compact signatures and full schemas. Calls use `dispatch_action`, or the core's [`resolveDeferredTool`](https://github.com/openclaw/openclaw/blob/7992b413a8b524c0a29c5b86e4e50c057a777a3a/packages/agent-core/src/agent-loop.ts#L955) hook for direct calls in directory mode. |
| [Pi](https://github.com/earendil-works/pi) | Supports direct, code-mode, and deferred exposure; code-mode declarations have an inline budget. | [Code mode](https://github.com/earendil-works/pi/blob/35dfa757378bd7a8570670e99c2687bdd1039a06/packages/coding-agent/src/extensions/codemode/tool.ts) provides discovery helpers and `ALL_TOOLS`. A separate [BM25 tool search](https://github.com/earendil-works/pi/blob/35dfa757378bd7a8570670e99c2687bdd1039a06/packages/coding-agent/src/extensions/tool-search/tool.ts) activates native tools for subsequent model calls. |
| [eve](https://github.com/vercel/eve) | Eager tools, fixed catalog tools, and a bounded namespace/connection listing. | [`eve__search`](https://github.com/vercel/eve/blob/db7850007a424b2f0d62f1909145acd2ff2d124f/packages/eve/src/execution/catalog/search.ts) returns names and TypeScript signatures. `eve__tool({name,input})` invokes them through one fixed schema, without promoting each result into the native tool list. |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | Native execution exposes all currently visible schemas. Programmatic calling exposes `run_code` plus an SDK for those tools. | The inspected [programmatic executor](https://github.com/deepseek-ai/deepseek-harness/blob/ce7073d51254c26cd63b22a60835b8f948deb447/packages/core/tool-executor-ptc/src/index.ts) renders the whole visible SDK. It changes execution style, but does not itself defer definitions until search. |
| [Happen](https://github.com/meoyawn/happen) | A small core interface and bounded namespace summaries; external schemas remain in the host registry. | Shared BM25 discovery returns declarations inside code mode or selectively loads schemas for direct calls. Compaction restores only explicitly loaded native tools. |

The Claude Code source above comes from
[codeaashu's leaked-source mirror](https://github.com/codeaashu/claude-code),
at revision `b983a3b`. It is a community-maintained snapshot, not an official
source release or proof of the exact implementation shipping today. The other
implementation links also pin the revisions inspected for this comparison.

DeepSeek Harness illustrates an easy mistake: one execution tool can still
come with a huge description of every function behind it. Code execution and
deferred tool discovery solve different parts of context growth.

In Happen, I use code mode as the primary path. Searching with
`tools.tool_search({query, limit})` returns declarations without changing the
native tool list. `ALL_TOOLS` remains available for exact lookup and filtering.
Direct discovery loads only its matches. After compaction, namespace summaries
and explicitly loaded native schemas return; ordinary discovery output follows
the rest of conversation history. The same policy serves GPT and DeepSeek.

Prompt caching makes placement matter too. OpenAI's
[tool-search API](https://developers.openai.com/api/docs/guides/tools-tool-search#tool-search-and-caching)
appends loaded definitions at the end of context, preserving the earlier
prefix.

## How hints guide tool search

With around 20 installed plugins, several integrations might expose tools for
searching documents, creating issues or inspecting a page. The model needs
enough source identity and capability metadata to formulate a useful query.
Composer selections and server summaries supply that context before retrieval.

### Codex: explicit plugin selection

In Codex 0.166.0,
[`collect_explicit_plugin_mentions`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/plugins/mentions.rs)
resolves structured or Markdown-linked `plugin://` references by exact plugin
ID. The
[turn builder](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/session/turn.rs#L244)
adds those plugins' MCP servers to its startup requirements before capturing
the first request's tool catalog. A selection therefore affects server
readiness as well as prompt content.

[`build_plugin_injections`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/plugins/injection.rs)
then maps each explicitly mentioned plugin to its available MCP server names,
enabled app labels and skill namespace. It wraps the resulting text in
[`PluginInstructions`, with `role: "developer"`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/context/plugin_instructions.rs).
When the plugin has available apps, the full hint explicitly tells the model
to search their tools before falling back to unrelated or built-in tools.

The
[renderer](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/plugins/render.rs)
caps each plugin hint at 4 KiB. With `SimplifiedSelectionHints` enabled, it
replaces the capability mapping with a shorter instruction naming the selected
plugin and asking the model to use its skills and tools. That retains the
user's selection but supplies fewer concrete names for query construction.

The
[`tool_search` input schema](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/tools/handlers/tool_search_spec.rs)
still contains only `query` and `limit`.
[`ToolSearchHandler`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/tools/handlers/tool_search.rs)
ranks deferred registry entries using BM25; the hint adds no plugin filter or
ranking weight. Its retrieval effect depends on the model using the supplied
identity in its query. Server startup can also make previously unavailable
tools discoverable.

Schema loading follows that search. For a native call,
[`ToolSearchOutput::to_response_item`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/tools/context.rs#L281)
returns `tool_search_output` with `execution: "client"`, the search `call_id`
and the selected schemas in `tools`. A code-mode search returns callable names
and TypeScript declarations as tool output. The plugin hint itself carries
neither form of tool declaration.

### Grok Build: hints from connected servers

Grok Build's local MCP path derives its hints from a shared
[`ToolMetadataSnapshot`](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-shell/src/session/tool_index.rs).
It contains tool metadata, server metadata and an initialization flag. Server
descriptions can come from the MCP initialize response's `instructions` field.
The
[reminder renderer](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/implementations/search_tool/mod.rs)
emits each server's name, tool count and description, with descriptions
sanitized and capped at 2,048 characters. Individual tool names and schemas
stay out of this listing.

The
[session injector](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-shell/src/session/acp_session_impl/mcp.rs#L672)
tracks fingerprints containing the tool count and hashes of the description
and tool names. Its default delta mode announces added, changed or removed
servers. It appends a usage instruction requiring `search_tool` to retrieve
the input schema before `use_tool`. The model gets both integration names
and an explicit rule to discover schemas before dispatch.

Those names participate directly in retrieval. The
[index](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-shell/src/session/tool_index.rs)
builds each BM25 document from the server name, tool name, description and
parameter names. It also appends identifier components split at `__`, `_`,
`-` and camelCase boundaries, and normalizes queries similarly. A query such
as `linear create issue` can therefore match the server identity as well as
the operation. The server name is a ranking term, not a mandatory filter.

Before BM25, the index tries a case-insensitive exact match on the qualified
or bare tool name. A collision between bare names returns the first matching entry;
using `server__tool` disambiguates tools from different servers. Otherwise,
the index ranks the current snapshot and returns up to `limit` matches, five
by default. The handler groups results by server and returns `tool_name`,
`description`, `score` and `input_schema` as JSON tool output. It reports
`status: "partial"` while the snapshot is still initializing. Calls continue
through `use_tool`; discovery leaves the native tool list unchanged.

Grok's composer also exposes plugin skills through
[ACP slash commands](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-pager/src/slash/acp_command.rs).
Their metadata includes `pluginName`, and invocation passes `/name args` to
the shell for skill expansion. The server hint above is generated
from the session's MCP catalog and does not require that selection.

### OpenClaw: a tool directory supplied by the host

OpenClaw separates the loop in `packages/agent-core` from the discovery policy
in its outer harness. The host's
[`buildToolSchemaDirectoryPrompt`](https://github.com/openclaw/openclaw/blob/7992b413a8b524c0a29c5b86e4e50c057a777a3a/src/agents/tool-search-directory.ts)
lists unique deferred tool names, optional owner names and short descriptions
for entries whose source is `openclaw`. A separate notice points to MCP and
client tools available through search. The directory reserves room for
discovery instructions and reduces descriptions from 180 characters to 64,
then removes descriptions before dropping rows. Its budget is
`min(18_000, max(768, floor(contextTokenBudget / 10)))` characters when the
token budget is known, or 18,000 characters otherwise.

The host's
[`ToolSearchRuntime`](https://github.com/openclaw/openclaw/blob/7992b413a8b524c0a29c5b86e4e50c057a777a3a/src/agents/tool-search-runtime.ts)
prefers exact ID or name matches over BM25 results and returns compact input
signatures. `tool_describe` retrieves the full schema. The directory's usage
instructions depend on the configured mode: `tools` directs calls through
`dispatch_action({ id, args })`; `directory` also permits direct calls to
unique deferred names. These are host policies; `agent-core` receives the
resulting tool set through `AgentContext.tools`.

For the direct path, the host
[wires `resolveDeferredTool` to its catalog](https://github.com/openclaw/openclaw/blob/7992b413a8b524c0a29c5b86e4e50c057a777a3a/src/agents/embedded-agent-runner/run/attempt-session-prepare.ts#L168).
The core invokes that hook when the model calls a name absent from the current
tool set. It rejects a returned tool with a different name, appends a matching
tool to the current context for later provider requests, and validates the
call against that tool's schema before execution. The trigger is an attempted
call; returning a search result alone does not invoke this hook. The host's
catalog resolver only supplies an unambiguous visible entry that permits
lookup by name.

### Context cost and retrieval behavior

Selecting one Codex plugin out of 20 adds at most one hint, bounded at 4 KiB.
That is separate from advertising the available search sources: when enabled,
the source listing in `tool_search` has its own 512 KiB aggregate budget and
reserves room for source names before descriptions. A hint for the selected plugin
does not remove that baseline catalog cost.

Grok bounds each server description, but the reminder renderer has no
aggregate budget for the server list. Its initial listing grows with the number of
servers; delta announcements limit repeated listings when the catalog changes.
The default of five search results bounds the number of retrieved schemas, not
their total size. Installed plugins, connected servers and searchable tools
are different counts: one plugin can supply several servers or only skills.

Hints provide concrete input for query generation, while exact lookup,
ranking and schema exposure remain separate mechanisms. To measure their
benefit with those 20 plugins, compare the same tasks and catalog with and
without the hints: retrieval recall at the chosen result limit, search retries,
context tokens and latency for completed tasks. The source establishes how
hints can affect discovery; it does not establish the size of that improvement.
