---
title: "Tool search: how AI harnesses load tools on demand"
description: Codex, Claude Code, OpenCode, Pi, eve, DeepSeek Harness, and Happen take different routes to smaller tool catalogs.
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

The idea predates the recent MCP ecosystem. July 2023's
[ToolLLM](https://arxiv.org/abs/2307.16789) already included a retriever that
selected APIs for an instruction. Anthropic
[introduced MCP in November 2024](https://www.anthropic.com/news/model-context-protocol),
making integrations easier to connect. Deciding how much of their catalog to
show the model remained a separate problem.

The public milestones reach well before summer 2026. Cloudflare described
[Code Mode on September 26, 2025](https://blog.cloudflare.com/code-mode/):
present APIs as TypeScript and let the model compose calls in code. Anthropic's
[November 4 post](https://www.anthropic.com/engineering/code-execution-with-mcp)
explicitly described reading tool definitions on demand or finding them with
`search_tools`. Its
[November 24 release](https://www.anthropic.com/engineering/advanced-tool-use)
added API-level tool search and `defer_loading`.

[Claude Code 2.1.7, released January 14, 2026](https://github.com/anthropics/claude-code/releases/tag/v2.1.7),
enabled automatic MCP tool search when definitions exceeded 10% of the context
window. Its [current documentation](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search)
describes deferral by default on supported configurations, with that threshold
available as an optional mode. These are concrete release milestones, rather
than a claim that the whole ecosystem switched at once.

The implementations now make different choices:

| Harness | Initially visible | Discovery and invocation |
| --- | --- | --- |
| [Codex](https://github.com/openai/codex) | Core tools and bounded summaries of deferred namespaces. | [Local BM25 search](https://github.com/openai/codex/blob/67f0994b532b8740f14b5b738af7b7b2a915b1d6/codex-rs/core/src/tools/handlers/tool_search.rs) supports both paths: native `tool_search_output` loads schemas; code-mode search returns callable names and TypeScript declarations. |
| [Claude Code](https://github.com/anthropics/claude-code) | In the inspected mirror, deferred tools are announced by name; their parameter schemas stay deferred. | The [mirrored implementation](https://github.com/codeaashu/claude-code/blob/b983a3b8106bf77cbae6d439f700cc74d74ccd15/src/tools/ToolSearchTool/ToolSearchTool.ts) uses weighted keyword matching or exact `select:` queries. Results contain `tool_reference` blocks that load definitions for direct calls. |
| [OpenCode](https://github.com/anomalyco/opencode) | A [partial code-mode catalog](https://github.com/anomalyco/opencode/blob/173f6c6dce7db669679625f6af93651ae66f16be/packages/core/src/codemode/catalog.ts), plus namespace summaries. | [`search`](https://github.com/anomalyco/opencode/blob/173f6c6dce7db669679625f6af93651ae66f16be/packages/codemode/src/tool-runtime.ts) returns descriptions and typed signatures, with namespace filtering and pagination. Calls run through code mode. |
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
prefix. I covered Codex's envelopes in
[How Codex loads plugin tools](/writing/how-codex-loads-plugin-tools/).

Deferred tool discovery trades initial context for a discovery step. The useful
measurement is cost and time per successfully completed task, including searches, missed
matches, cache hits, and compaction. A smaller initial catalog is a promising
starting point; the complete workflow still has to earn the saving.
