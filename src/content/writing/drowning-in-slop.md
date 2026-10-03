---
title: Drowning in slop
description: Flutter made native dependencies feel like a swamp. Rust and the C ABI gave the slop somewhere to flow.
published_at: 2026-10-03
updated_at: 2026-10-03
---

Last week I tried Flutter for a desktop app.

The app needs FFmpeg, QuickJS, and SQLite. It needs to run on macOS and Windows, on more than one architecture. None of this is exotic. All three libraries are old, boring, and extremely well understood.

That should have been reassuring.

Instead I started sinking.

The problem was not any single dependency. Every problem was solvable. A package did not have the prebuilt binary I needed, so the agent started making GitHub Actions to build one. Windows found an integer type disagreement somewhere in the native toolchain. Another package had slightly different assumptions about how its artifacts should be arranged. Then came application updates, which meant Sparkle on macOS and WinSparkle on Windows, and another trip through native wrappers.

Nothing was catastrophically broken.

That was the problem.

Each little inconvenience was reasonable in isolation. Fork the package. Fix the build hook. Add another target. Patch the wrapper. Publish the missing binary. Keep going.

And with an agent, you *can* keep going.

The agent does not get tired. It happily builds another bridge over the swamp.

I do.

The strange thing is that I already had the same app working in Rust with GPUI.

My Rust is bad. The libraries I am using are not perfect. I am moving fast and letting an agent write code I would not pretend to fully understand.

This should be where the slop wins.

Instead it just works.

The difference, more than anything else, is the C ABI.

FFmpeg speaks C. SQLite speaks C. QuickJS speaks C.

Rust can meet them there.

Not through a Flutter package maintained by somebody who had to anticipate my exact platform matrix. Not through a build hook that has to understand how Dart wants native artifacts packaged. Not through another layer whose job is to translate one ecosystem's assumptions into another ecosystem's assumptions.

Just a boundary that has existed for decades.

There is something comforting about dropping through all the modern abstractions and finding that old floor underneath them.

C is not the language I want to write my application in. It is not safe, elegant, or particularly pleasant.

But as an ABI it is the lingua franca of computers.

The important part is not that C is good. The important part is that everybody already agreed on it.

That agreement is incredibly valuable when coding with agents.

Agents make it cheap to cross boundaries. That sounds like a pure advantage until you have crossed enough of them that the application becomes a pile of tiny local solutions.

One wrapper is fine.

Ten wrappers are still fine.

Then one of them stops publishing Windows ARM64 artifacts, another assumes MSVC while something else expects an MSYS environment, another package is abandoned, and the agent starts constructing infrastructure around infrastructure.

Every fix is correct.

The whole thing is drowning.

Rust did not remove the slop. If anything, there is plenty of it. I am still asking an agent to wire together systems I barely know.

But Rust gives the slop a riverbed.

The unsafe native boundary is visible. On one side is the C API. On the other side is Rust. Once the values cross that boundary, Rust's type system gives the mess some walls.

I can reason about one ugly edge instead of a tower of adapters.

That changes how reckless I can afford to be.

With Flutter, fast agentic development felt like running across a swamp. As long as I stayed on the path prepared by the ecosystem, the speed was amazing. The moment I needed enough native pieces, each step started depending on whether somebody had built the next plank.

With Rust, I can drop lower.

There is usually bedrock down there.

I used to think the opposite of slop was discipline.

Now I am not sure.

Maybe the trick is not to avoid the slop.

Maybe you need to find a system where it has somewhere to flow.
