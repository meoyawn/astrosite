---
title: "2026: ripgrep is still king"
description: Current gen LLMs reward simple tools
published_at: 2026-08-19
---

Current-generation LLMs can already explore and edit code with files, search,
and shell. Any proposed workflow improvement must beat that baseline before it
earns another interface.

This article started with a Sunday meditation from Pi:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Good morning from Vienna People of Pi 🌞<br><br>Sunday meditations from <a href="https://x.com/badlogicgames?ref_src=twsrc%5Etfw">@badlogicgames</a> and <a href="https://x.com/mitsuhiko?ref_src=twsrc%5Etfw">@mitsuhiko</a><br><br>- On memory: code is the truth <br>- Bash is all you need <br>- Build context efficient tools <a href="https://t.co/yZQe6KtWgh">pic.twitter.com/yZQe6KtWgh</a></p>&mdash; Pi (@pidotdev) <a href="https://x.com/pidotdev/status/2088951405155426757?ref_src=twsrc%5Etfw">August 16, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

The video's three points reinforce each other. The repository is the memory:
code is the evolving ground truth, while a semantic memory is another system
to maintain. Models can infer structure and style from a few files and `rg`
results. They also speak shell and can compose their own workflow. In the
video's Sentry example, a skill downloads 52 results as JSON, puts only three
in context, and leaves the rest available through `jq`. The goal is not Bash
for its own sake, but composability within a deliberate context budget.

Current models make general-purpose primitives unusually powerful because they
write the glue themselves. Every extra index, protocol, or specialist must
therefore prove an end-to-end gain at equal quality—not merely a cleaner query
or smaller tool response. I tested that standard against semantic navigation.

## Testing the strongest case

[`gopls`](https://go.dev/gopls/) is the strongest case for giving an agent more
than grep. The official Go language server powers completion, diagnostics,
rename, Go to Definition, and Find All References. It also exposes a CLI:

```sh
gopls definition path/to/file.go:#offset
gopls references path/to/file.go:#offset
gopls implementation path/to/file.go:#offset
gopls call_hierarchy path/to/file.go:#offset
```

Unlike ripgrep, `gopls` resolves symbols. Its
[navigation queries](https://go.dev/gopls/features/navigation) distinguish
same-named methods, follow cross-package references, and find concrete types
that implicitly implement an interface. But its
[CLI](https://go.dev/gopls/command-line) is officially experimental and mainly
intended for debugging; one-shot use can pay startup costs unless it connects
to a daemon. Precision brings a server, project model, source positions, and a
new interface.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">I&#39;m writing Go again (for what, you&#39;ll see later...). `go doc` and `gopls` are like agent superpowers and its shocking how productive agents are out of the box at writing [good] Go code versus other languages I&#39;ve used (including the JS ecosystem). Also, Go + Zig is a good mix.…</p>&mdash; Mitchell Hashimoto (@mitchellh) <a href="https://x.com/mitchellh/status/2046319366489407803?ref_src=twsrc%5Etfw">April 20, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

That trade starts asymmetrically. Work usually begins with a bug report,
behavior, or name—not an exact source position. Models already turn those clues
into `rg` queries, targeted reads, and follow-up searches. Semantic navigation
can return a more precise intermediate answer without simplifying the whole
task. In my experience, Go agents remain just as effective with ripgrep; I have
not run a controlled `gopls`-versus-ripgrep benchmark, so this is an
observation, not a quantitative claim.

## TypeScript goes native

On July 8, 2026, Microsoft released
[TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/),
the native Go port of its compiler and tools. Microsoft reported typical
full-build speedups of 8× to 12×, lower memory use, and a much faster LSP-based
language server. Because the compiler, project system, and language service now
coexist as Go packages, a fork can link them into a standalone binary. That
made semantics cheap enough to package as a shell tool and test fairly.

## Building tspls

I built [`tspls`](https://github.com/meoyawn/tspls), a `gopls`-style CLI for
one-shot TypeScript queries:

```sh
tspls definition src/app.ts:12:8
tspls references -d src/app.ts:12:8
tspls call_hierarchy src/app.ts:12:8
tspls implementation src/app.ts:12:8
tspls check src/app.ts
```

`tspls` runs TypeScript 7's native project and language-service packages
in-process. It uses no LSP server, JSON-RPC connection, daemon, child `tsgo`
process, or persistent index. Each invocation discovers the workspace's
`tsconfig.json` files, opens its projects in one session, prints stable file
spans for one query, and exits.

GPT-5.6 Sol built the
[initial implementation](https://github.com/meoyawn/tspls/commit/d8d171cdb2a20072ea61a5d78124b2e5f01ad3b5)
in about 40 minutes at high reasoning. This gave semantics every architectural
advantage while preserving its real costs: another interface and exact source
positions. The benchmark asked whether its cleaner answers justified those
costs.

## The benchmark

I ran three benchmarks on [Listenbox](https://listenbox.app/). Two asked agents
to find every consumer of a distinctive name. The third used a common name
with unrelated textual matches: the case most favorable to semantic
navigation.

Each task had two arms. One agent could use the tspls skill; the other had only
ripgrep and ordinary file reads. Both ran
[GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) at
`max` reasoning with fixed prompts and sandbox. Answers were graded blind
against a static oracle. Every included answer scored 100/100, leaving
efficiency as the difference. Output-token counts include reasoning tokens.

| Three-task aggregate | tspls | ripgrep | Observed difference |
|---|---:|---:|---|
| Correctness | 300/300 | 300/300 | Same answer quality |
| Total input tokens | 1,116,125 | 1,078,545 | ripgrep used 37,580 fewer (3.4%) |
| Cached input tokens | 999,424 | 930,688 | tspls used 68,736 more cached |
| Uncached input tokens | 116,701 | 147,857 | tspls used 31,156 fewer (21.1%) |
| Output tokens (reasoning included) | 35,117 | 32,300 | ripgrep used 2,817 fewer (8.0%) |
| Estimated API cost | $0.08547 | $0.08695 | Only $0.00148 apart (1.7%) |
| Tool calls | 35 | 40 | tspls made five fewer (12.5%) |
| Files opened | 14 | 54 | tspls opened 40 fewer (74.1%) |
| Tool output | 148,545 bytes | 244,275 bytes | tspls emitted 95,730 fewer bytes (39.2%) |
| Wall time | 687.830 s | 649.971 s | ripgrep finished 37.859 s sooner (5.5%) |

For the collision-heavy task, I averaged two clean repeats. I rounded its
token and tool-call averages to whole units before computing the aggregate.

`tspls` reduced repository reads, tool calls, and tool output. Ripgrep still
used fewer total input and output tokens and finished 5.5% sooner, with equal
answers. Estimated cost was effectively tied because `tspls` traded 31,156
uncached tokens for 68,736 cached ones. At GPT-5.6 Luna's standard rates—$0.20
per million uncached input tokens, $0.02 per million cached input tokens, and
$1.20 per million output tokens—the estimates are $0.08547 and $0.08695.
Reasoning is already included in output. The run data cannot reconstruct
cache-write or long-context surcharges precisely, so the $0.00148 gap is not a
cost win.

The collision-heavy task did favor `tspls`: seven fewer calls, 38 fewer files,
75 KB less tool output, and about 40 seconds less wall time. On the two
low-collision tasks, however, ripgrep needed only a literal search and a few
reads. `tspls` still had to discover projects, initialize the compiler, locate
a source position, and decide when to use an unfamiliar tool. Its best case did
not overcome ripgrep's aggregate speed and token advantage.

Three tasks in one repository cannot prove that ripgrep always wins. They do
show why hypothetical edge cases are weak grounds for agent tooling: even with
a collision-heavy case chosen to favor semantics, both stacks were correct and
teaching `tspls` did not improve the aggregate workflow. Broader, independent
benchmarks should test whether that result generalizes.

## What other benchmarks show

I found no direct agent-level `gopls`-versus-ripgrep benchmark measuring both
task success and billed token cost.

The closest gopls-specific comparison is
[`agent-lsp`'s token-savings experiment](https://github.com/blackwell-systems/agent-lsp/blob/main/docs/guide/token-savings.md).
It reports 5× less context on a 15,000-line Go repository and 34× less on
Consul. But it scripts both workflows, estimates one token per four bytes,
excludes language-server startup, and does not establish equal task success.
That measures payloads, not what an agent spends to finish a task.

A more relevant 2026 preprint,
[*Does a Language Server Save Tokens for Coding Agents?*](https://arxiv.org/abs/2608.13568),
runs real grep and LSP agent loops on Python and TypeScript—not Go or `gopls`.
For symbol-named localization, LSP cost strong models 6–118% more tokens. For
reference-finding it improved precision but still cost capable models more. On
the collision-heavy Hono codebase, however, it was both more accurate and 12%
cheaper.

That pilot is small and harness-dependent, but its mixed result is useful:
compare complete tool stacks across representative tasks, equal correctness,
successful-task cost, and wall time. Query-level precision alone cannot choose
an agent toolkit.

## Complexity needs task-level evidence

[`ast-grep`](https://github.com/ast-grep/ast-grep) matches Tree-sitter syntax,
which is useful for structural search, lint rules, and codemods.
[`code-review-graph`](https://github.com/tirth8205/code-review-graph) builds a
persistent graph of functions, imports, calls, inheritance, and tests. Both can
do work text search cannot; neither gets an end-to-end win for free.

`code-review-graph`'s headline token reduction compares graph answers with
reading an entire repository—an upper bound no competent grep-driven agent
pays. A sound comparison needs the same model, tasks, correctness threshold,
API usage, and time to successful completion. It must count cold indexing,
warm queries, maintenance, failed searches, and verification.

A persistent graph also becomes a second representation of the repository. In
my use, it is least reliable across language boundaries: a Go route,
TypeScript client, OpenAPI operation, SQL column, and config key can describe
one feature without sharing a graph edge.

The worst offender is [`Probe`](https://github.com/probelabs/probe). Its LSP
mode can auto-start a daemon that discovers workspaces, pools language servers,
indexes projects, and maintains memory and disk caches. Its documentation calls
this “zero startup time” because startup moved into the background. In my
TypeScript 7 test, Probe with the `tsgo` LSP needed a custom Node.js wrapper to
work. A daemon starting language servers through a wrapper, all to avoid `rg`,
needs measured benefit—not assumed benefit.

## Other tools promising token efficiency

[`rtk`](https://github.com/rtk-ai/rtk), the Rust Token Killer, installs a binary
and hook that intercept shell commands and replaces their output with a
compressed dialect. That adds installation, command rewriting, compatibility
risk, and recovery behavior. It is a shitty trade unless complete tasks become
cheaper or faster.

An independent
[JetBrains paired benchmark](https://blog.jetbrains.com/ai/2026/07/rtk-claude-code-token-savings/)
tested shipped RTK on 86 SkillsBench tasks. Quality was unchanged. At low
reasoning effort, median task cost rose 7.6% and turns rose 13.8%; at high
effort, cost was effectively flat. RTK's counter claimed 96.2 million tokens
saved during the low-effort run while the measured bill increased.

The independent [*LogDx-CI* benchmark](https://arxiv.org/abs/2605.28876)
compared 11 log-reduction methods, including three RTK modes, across 35 real CI
failures. Hybrid grep-and-tail routers dominated its cost-quality frontier.
Models often recovered from weak initial context, but needed two to four times
more tool calls.

Smaller tests reinforce the method. JetBrains measured the
[Caveman skill's claimed 65% saving](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/)
at 8.5% of output tokens and roughly 10% of cost at best when activation was
forced. A separate
[Codex comparison of Caveman and RTK](https://github.com/dd3ok/caveman-rtk-benchmark/blob/main/docs/results-official-caveman-gpt55-v1.md)
kept correctness at 100% across 60 runs, but found frequent RTK overhead on the
smaller fixture and mixed results on the larger one. The study is too small for
a universal verdict—which is exactly why efficiency claims need independent
replication.

## Benchmark the whole task

Humans need not prescribe when agents search twice, narrow a pattern, or choose
a fallback. They need to choose the toolkit that minimizes wall time and actual
cost per successful task at equal correctness.

That requires paired benchmarks of LSPs, indexes, graphs, and context
compressors that include setup, startup, retries, cache pricing, verification,
and failures—not just tool-output bytes. Current evidence favors ripgrep and
simple shell pipelines: `tspls` did not improve this aggregate workflow,
agent-level LSP results are mixed and usually costlier for strong models, and
RTK loses despite impressive self-reported compression. This is the evidence
now, not a permanent law.

Shoutout to Jesse Wilson, who wrote a decade ago that
[case mapping breaks search](https://publicobject.com/2016/01/20/strict-naming-conventions-are-a-liability/).
Coding tools change; greppable code keeps winning. Never break grep.
