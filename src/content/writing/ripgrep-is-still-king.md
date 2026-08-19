---
title: "2026: ripgrep is still king"
description: Current gen LLMs reward simple tools
published_at: 2026-08-19
---

Current-generation LLMs reward simple, composable tools. They already know how
to turn files, text search, and the shell into a code-navigation workflow, and
they can write the missing glue themselves. Every extra layer has to earn the
cost of replacing that familiar workflow.

This article started with a Sunday meditation from Pi:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Good morning from Vienna People of Pi 🌞<br><br>Sunday meditations from <a href="https://x.com/badlogicgames?ref_src=twsrc%5Etfw">@badlogicgames</a> and <a href="https://x.com/mitsuhiko?ref_src=twsrc%5Etfw">@mitsuhiko</a><br><br>- On memory: code is the truth <br>- Bash is all you need <br>- Build context efficient tools <a href="https://t.co/yZQe6KtWgh">pic.twitter.com/yZQe6KtWgh</a></p>&mdash; Pi (@pidotdev) <a href="https://x.com/pidotdev/status/2088951405155426757?ref_src=twsrc%5Etfw">August 16, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

The video's argument is more specific than those three bullet points. For
coding, the repository is the memory system: code is the evolving ground truth,
while a separate semantic memory becomes another thing to maintain. Models can
usually infer structure and style from a few files; at most, they may need a
lightweight map of folders. Embeddings, AST indexes, and other layers should
have to prove that they improve the result instead of being installed on faith.

“Bash is all you need” is the operational half of the argument. Models already
speak shell, so a small agent can extend itself by composing programs and files.
In the video's Sentry example, a custom skill downloads 52 results as JSON,
places only three in context, and lets the model inspect the rest with `jq` if
needed. The important property is not Bash or MCP by itself. It is composability
with a deliberate context budget.

This is not minimalism for its own sake. Current models make general-purpose
primitives more powerful because they can write the glue and adapt the workflow
themselves. Every extra index, protocol, or specialist replaces a skill they
already have with another interface they must learn.

That gives semantic code navigation a sharper test. Compiler-aware tools can
distinguish symbols that text search cannot. But will a cleaner query improve
the completed task, or is a model already fluent in shell tools better off
reading the code directly?

## The strongest case for semantics

[`gopls`](https://go.dev/gopls/) is the strongest case for giving an agent more
than grep. Pronounced “Go please,” it is the official Go language server,
maintained by the Go team. A language server provides the code intelligence
behind editor features such as completion, diagnostics, rename, Go to
Definition, and Find All References. Editors usually keep `gopls` running and
talk to it over the Language Server Protocol, but it also exposes a CLI:

```sh
gopls definition path/to/file.go:#offset
gopls references path/to/file.go:#offset
gopls implementation path/to/file.go:#offset
gopls call_hierarchy path/to/file.go:#offset
```

The [`gopls` CLI](https://go.dev/gopls/command-line) is officially experimental
and intended mainly for debugging. The long-running server is the mature,
incremental part; one-shot CLI use can still pay startup costs unless it
connects to a daemon. That distinction matters when comparing agent tools.

Unlike ripgrep, `gopls` knows which symbol an identifier resolves to. Its
[navigation queries](https://go.dev/gopls/features/navigation) can distinguish
same-named methods, follow references across packages, and find concrete types
that implement an interface. That last operation is especially valuable in
Go: interface satisfaction is implicit, so there is no `implements` keyword
for a text search to find.

This is useful for agents too. On an unfamiliar Go codebase, exact definitions,
references, implementations, and call hierarchies can replace a lot of manual
disambiguation. Its capability is not in question. Whether adding and
maintaining that machinery improves the agent's whole workflow is.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">I&#39;m writing Go again (for what, you&#39;ll see later...). `go doc` and `gopls` are like agent superpowers and its shocking how productive agents are out of the box at writing [good] Go code versus other languages I&#39;ve used (including the JS ecosystem). Also, Go + Zig is a good mix.…</p>&mdash; Mitchell Hashimoto (@mitchellh) <a href="https://x.com/mitchellh/status/2046319366489407803?ref_src=twsrc%5Etfw">April 20, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

The comparison is asymmetric because of the agent's starting point. Most work
begins with a vague bug report, a behavior, or a name—not a perfect source
position. Models in 2026 already know how to turn those clues into `rg` queries,
targeted reads, and follow-up searches. A new semantic tool asks them to learn
another interface and often to locate an exact position before using it. The
semantic answer may be better while the whole task becomes no simpler. In my
experience, Go agents remain just as effective with ripgrep for most work. I
have not run a controlled `gopls`-versus-ripgrep benchmark, so that is an
observation, not a quantitative claim.

## TypeScript goes native

On July 8, 2026, Microsoft released
[TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/),
the native Go port of the TypeScript compiler and tools. Microsoft reported
typical full-build speedups of 8× to 12×, lower memory use, and a new LSP-based
language server with much faster editor operations.

The release matters beyond the headline speedups. The compiler, project system,
and language service now coexist as Go packages. A fork can link them into a
standalone native binary, call them directly, and experiment without wrapping
an editor extension or keeping a JavaScript language-server process alive.
That did not invent semantic navigation, but it made semantics cheap enough to
package as a shell tool and test the minimalist thesis fairly.

## Building tspls

With that foundation, I built [`tspls`](https://github.com/meoyawn/tspls), a
`gopls`-style CLI for one-shot TypeScript queries:

```sh
tspls definition src/app.ts:12:8
tspls references -d src/app.ts:12:8
tspls call_hierarchy src/app.ts:12:8
tspls implementation src/app.ts:12:8
tspls check src/app.ts
```

It runs the native TypeScript 7 project and language-service packages directly
in-process. There is no LSP server, JSON-RPC connection, daemon, child `tsgo`
process, or persistent index. Each invocation treats the current directory as
a workspace, discovers its `tsconfig.json` files, opens the projects in one
session, executes one query, prints stable file spans, and exits.

That shape is intentional: one command in, compact source spans out. `tspls`
keeps the repository as the source of truth and composes with files, pipes, and
the rest of the CLI. It is substantial semantic machinery packaged as a simple
tool an agent can inspect and combine.

GPT-5.6 Sol built the
[initial tspls implementation](https://github.com/meoyawn/tspls/commit/d8d171cdb2a20072ea61a5d78124b2e5f01ad3b5)
in about 40 minutes using high reasoning.

The tool had already proved that semantics could return a cleaner result. The
benchmark asked whether adding even this lean specialist to a model's existing
toolkit would improve the completed work.

## The benchmark

I tested that bet on three code-navigation tasks in the real Listenbox
monorepo. Two searched for consumers of distinctive names: `isHttpURL` and
`pricingCheckoutHref`. The third targeted an exported symbol named `api`,
surrounded by unrelated APIs and textual collisions.

Each task used two arms: one agent could use the tspls skill, while the other
was limited to ripgrep and ordinary file reads. Both ran
[GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
at `max` reasoning; sandbox and prompts stayed fixed. Answers were graded blind
against a static oracle. Every included answer scored 100/100, so the remaining
question was efficiency.

The benchmark's output-token count already includes reasoning tokens. The table
therefore separates cached input, uncached input, and output—the recorded token
buckets used in the standard-rate estimate—instead of showing input alone.

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

For the collision-heavy task, I averaged two clean repeats. Tokens and tool
calls are counts, so I rounded those task-level averages to whole units before
computing the aggregate.

The table shows two kinds of simplicity. tspls simplified the context: it
examined far less of the repository and made fewer calls. ripgrep simplified the
workflow: it used a tool the model already knew, consumed slightly fewer total
input and output tokens, and finished 5.5% sooner. Both arms got every answer
right and their estimated cost was effectively tied.

The cost row explains why input tokens alone are misleading. ripgrep used
37,580 fewer input tokens overall and produced 2,817 fewer output tokens, but
tspls used 31,156 fewer uncached input tokens. Its larger input total came from
68,736 additional cached tokens, which cost one tenth as much as uncached input.
At GPT-5.6 Luna's standard rates—$0.20 per million uncached input tokens, $0.02
per million cached input tokens, and $1.20 per million output tokens—the
estimates are $0.08547 for tspls and $0.08695 for ripgrep. Reasoning is already
inside the output count and is not added again.

That $0.00148, or 1.7%, gap is effectively a tie. The cumulative run data cannot
reconstruct cache-write or long-context surcharges precisely, so calling it a
cost win would overstate the evidence.

tspls did exactly what it was built to do. Across the benchmark it opened 40
fewer files, emitted 95,730 fewer bytes of tool output, and used five fewer tool
calls. On the generic `api` symbol it was clearly more efficient: seven fewer
calls, 38 fewer files, 75 KB less tool output, and about 40 seconds less wall
time. Semantics helped exactly where lexical ambiguity was highest.

But the benchmark measured the whole agent workflow, not the purity of one
query. On the two distinctive names, the model could search a literal, inspect
a few matches, and reconstruct the answer using a workflow it already knew.
With tspls it still had to discover projects, initialize the compiler, locate a
precise source position, and decide when the unfamiliar tool was worth calling.
The cleaner intermediate result did not improve the final answer, cost, or
aggregate speed.

Current models reward simplicity because familiar primitives compound. The
agent can vary an `rg` pattern, pipe the result, narrow its reads, and verify the
answer without switching mental models. A new tool does not compete with raw
text search in isolation; it competes with that whole learned repertoire. Being
more precise is not enough. It has to improve the completed task after the cost
of teaching and using it.

Three tasks in one repository do not justify a universal claim. They support a
narrower one: a good semantic tool is not automatically a useful addition to a
strong coding agent. In this benchmark, teaching tspls did not pay overall.

## What other benchmarks show

I looked for a direct, agent-level `gopls`-versus-ripgrep benchmark that
measured both task success and billed token cost. I did not find one.

The closest gopls-specific comparison is
[`agent-lsp`’s token-savings experiment](https://github.com/blackwell-systems/agent-lsp/blob/main/docs/guide/token-savings.md).
It reports a 5× context reduction for LSP on a 15,000-line Go repository and a
34× reduction on Consul. Those are interesting payload measurements, but not
agent dollar costs: the experiment scripts both workflows, estimates one token
per four bytes, excludes language-server startup, and does not establish equal
task success. It measures the outputs of hand-scripted workflows, not what an
agent actually chooses or spends to finish a task.

A more relevant 2026 preprint,
[*Does a Language Server Save Tokens for Coding Agents?*](https://arxiv.org/abs/2608.13568),
runs real agent loops with grep and LSP tools on Python and TypeScript—not Go or
`gopls`. Its answer is conditional and usually negative. On symbol-named
localization, LSP cost strong models 6–118% more tokens. On reference-finding it
bought precision but still carried a token premium for capable models. Yet on
the collision-heavy Hono codebase it was both more accurate and 12% cheaper.

That pilot has its own small-sample and harness limitations, but its boundary
matches mine. Strong models do not automatically become cheaper when given an
LSP because they are not starting from zero: they already know how to search
code. A compact semantic answer has marginal value when lexical ambiguity
finally overwhelms that existing skill.

## Complexity has to earn its keep

The same standard applies to structural tools.
[`ast-grep`](https://github.com/ast-grep/ast-grep) matches Tree-sitter syntax
instead of raw text, which is excellent for structural search, lint rules, and
codemods. [`code-review-graph`](https://github.com/tirth8205/code-review-graph)
builds a persistent graph of functions, imports, calls, inheritance, and tests
for impact analysis and code review.

Both can do work that plain text search cannot. That still does not prove they
make an agent cheaper or faster. `code-review-graph`’s own documentation
acknowledges that its headline token reduction compares graph answers with
reading an entire repository—an upper bound no competent grep-driven agent
pays. Tool-output size is not dollar cost, and a short answer is not a win if
the agent misses a file or needs extra turns to recover.

These tools need independent agent benchmarks: same model, same tasks, same
correctness threshold, actual API usage, and wall-clock time to successful task
completion. Cold indexing, warm queries, graph maintenance, failed searches,
and verification all need to count. Until then, the numbers show that a tool
can compress its chosen examples, not that it improves the whole job.

A persistent graph also creates a second representation of the repository, with
its own maintenance burden. In my use, `code-review-graph` becomes least reliable
at cross-language boundaries. Parsing Go, TypeScript, SQL, YAML, and generated
code into one database is not the same as resolving the runtime contract between
them. A Go route, a TypeScript client, an OpenAPI operation, a SQL column, and a
config key may describe one feature without sharing a graph edge.

The worst offender is [`Probe`](https://github.com/probelabs/probe). Its LSP mode
can auto-start a persistent daemon, which discovers workspaces, boots and pools
multiple language servers, indexes projects, and maintains memory and disk
caches. Its documentation calls this “zero startup time” because the startup
cost has been moved into a background process.

In my TypeScript 7 test, Probe with the `tsgo` LSP did not work out of the box; I
had to put a custom Node.js wrapper in front of it. A daemon starting language
servers through a wrapper, all to avoid `rg`: this is exactly the kind of
complexity current models do not need.

## Keep it simple, stupid

The bottom line: for 2026-generation LLMs, stick to ripgrep. `rg`, file reads,
and the shell already form a fast, flexible code-navigation system that models
know how to use. Do not spend time and energy building semantic navigation,
indexes, graphs, or daemons for coding agents.

Semantics won one ambiguity-heavy task here. That is not enough to make them a
foundation, or even a default escape hatch. Cleaner intermediate results do not
matter when the completed work is no better, cheaper, or faster. Keep the
toolkit small and the repository greppable.

Shoutout to Jesse Wilson, who wrote a decade ago that
[case mapping breaks search](https://publicobject.com/2016/01/20/strict-naming-conventions-are-a-liability/).
Coding tools change; greppable code keeps winning. Never break grep.
