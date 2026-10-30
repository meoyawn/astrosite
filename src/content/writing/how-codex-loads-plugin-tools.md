---
title: How Codex loads plugin tools
description: From plugin mentions and MCP discovery to tool_search_output and additional_tools in the Responses API.
published_at: 2026-10-30
---

Yes, Codex can insert updated tool declarations into the Responses API's
conversation input. The item is called `additional_tools`. Deferred discovery
also has its own schema-bearing item, `tool_search_output`. An `@Browser`
mention can lead to tool loading, but its injected hint is only one step.

I traced this through upstream Codex 0.166.0.

## A mention prepares the runtime and guides the model

Codex recognizes structured and Markdown-linked `plugin://` references. At the
start of a turn, it
[collects the mentioned plugins and adds their MCP server names to the required-server set](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/session/turn.rs#L1030).
That can cause a plugin's server to be started or awaited before inference.

Separately,
[`build_plugin_injections`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/plugins/injection.rs)
constructs developer instructions pointing to the plugin's available MCP
servers, apps and skill namespace. The
[renderer](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/plugins/render.rs)
can instead emit a shorter selection hint behind a feature flag.

The hint gives the model direction. Callable schemas still have to reach it
through the tool catalog or discovery results. A fresh conversation does not
necessarily contain every installed tool's complete definition.

## Discovery returns actual declarations

Codex's
[`ToolSearchHandler`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/tools/handlers/tool_search.rs)
ranks deferred tool metadata using BM25. For a top-level search,
[`ToolSearchOutput::to_response_item`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/tools/context.rs#L281)
serializes the selected schemas as `tool_search_output`, with
`execution: "client"` and the originating search call's ID.

Here are the two API envelopes, sharing an illustrative tool definition:

```ts
const declarations = [{
  type: "function",
  name: "inspect_page",
  description: "Inspect the current page.",
  parameters: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
}]

const discoveryResult = {
  type: "tool_search_output",
  execution: "client",
  call_id: "call_search_1",
  status: "completed",
  tools: declarations,
}

const catalogUpdate = {
  type: "additional_tools",
  role: "developer",
  tools: declarations,
}
```

For client-executed discovery, the application includes `discoveryResult` in
the next Responses request's `input` array, after the search call. That item
loads callable definitions. OpenAI documents both
[client-executed search and explicit `additional_tools` insertion](https://developers.openai.com/api/docs/guides/tools-tool-search#client-executed-tool-search).

## Codex also maintains an incremental catalog

In the Responses Lite path,
[`TopLevelToolsState::render_diff`](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/context/world_state/top_level_tools.rs#L133)
compares hashes of namespace headers and individual members. It emits changed
declarations in `ResponseItem::AdditionalTools`, serialized as
`type: "additional_tools"`. Incremental namespace batches get a developer
notice; removals get a separate notice. Unchanged members stay declared.

The
[request builder](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/core/src/client.rs#L1057)
also represents initial tools as an `additional_tools` input prefix when
`use_responses_lite` is enabled. Its other branch uses the request-level
`tools` field. The transport mode matters: these are not interchangeable
descriptions of every Codex request.

Preserving earlier declarations and appending discoveries keeps the existing
context prefix available for caching. The plugin hint helps the model choose
what to discover; the API items carry the definitions that make calls possible.
