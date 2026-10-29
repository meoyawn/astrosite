---
title: Reverse engineering needs a feedback loop
description: A Flutter reconstruction kept me guessing for two days. A Go/MyGo rebuild taught me to research the stack, design the comparison loop, then let the agent run it.
published_at: 2026-10-29
---

Nearly 48 hours into rebuilding a Chromium-based desktop app in Flutter, I
had a version using about 250 MB of RAM where the original used around
1.5 GB. I also had an agent that could keep working indefinitely.

There was always another thing to fix. Playback, queue behavior, loading
delays, missing screens. Each gave us plausible work for the next iteration.
I wanted to keep the app that used one-sixth of the memory. I couldn't tell
how much work stood between it and a faithful reconstruction.

I was using [REA (Reverse Engineer Anything)](https://github.com/morluto/rea)
to give the agent access to binary analysis and application behavior. It could
investigate the original and write code from what it found. But I had asked
it to work out how the original worked while also rebuilding it in Flutter.

Every mismatch now had several possible explanations. Had we misunderstood
the original? Introduced a bug while translating it? Missed some interaction
between playback, credentials and session state? We had checks for parts of
the protocol, but no repeatable comparison covering the experience we were
trying to reproduce.

So we wandered. I checked the app, found something wrong, and sent the agent
back in. It made another correction. I checked again. Even with a human in the
loop, the number of interacting behaviors was too large to keep in my head.
The agent could keep producing changes long after I had lost confidence in
how close we were.

A Go application built with MyGo showed me what was missing. It contained
JavaScript too, and we successfully reconstructed that part.

For that reconstruction, we stayed with Go and matched the original compiler,
dependencies and known build settings. We could rebuild the recovered source
and compare individual functions with the original executable. A difference
gave the agent a specific question to investigate.

One height calculation looked reasonable in the reconstruction. It took
the largest resolution across the available formats. The original actually
looked only at video formats and used their raw height. For a portrait video,
that meant 1920 instead of 1080. The plausible implementation was wrong.

The agent corrected the rule and rebuilt. All 64 bytes of the compiled
function then matched the original, even though it lived at a different
address. We could rerun the comparison and get the same answer.

That was the loop I had been missing: inspect, reconstruct, rebuild, compare,
explain the difference, repeat. Each pass left behind evidence the next pass
could use. I no longer had to rediscover the same mistake by clicking around.

We reached that point in what I remember as less than an hour. We also had
38 matching offline command-line cases. It was a smaller application, and
those checks covered only particular functions and behaviors. Still, I could
point to what matched and run the comparison again.

The Flutter reconstruction is still unfinished. The memory saving makes me
want to finish it, but I now think I tried to change its architecture too
early.

Before attempting reverse engineering, research the original stack
thoroughly. Use engineering blog posts, architecture talks, release notes and
dependency notices to establish its languages, frameworks, runtimes and
native components. Identify versions where possible and check that each
source applies to the release you're studying. Treat this as an initial map;
the investigation will have to fill in undocumented details.

Use that understanding of the stack to design the verification loop.
Reconstruct in the original stack first: for an Electron app, start with
Electron. Decide which behaviors to recover and what counts as a match.
Capture the original's inputs, starting state and expected results. Choose
comparisons the stack supports, from compiled functions to observable state
transitions. Make those checks repeatable, with a clear stopping condition
for each behavior.

Then give the agent that loop to execute. It should investigate a discrepancy,
reconstruct the relevant code, rebuild, run the comparison and use the result
to choose its next correction. Keep earlier cases in every run so a new fix
cannot silently undo an old one. Missing evidence stays an open question.

Once those behaviors reliably match, move them into Flutter or another
stack. The verified reconstruction becomes a runnable reference for the
rewrite, and the same cases can check that the migration preserves behavior.

I still want the 250 MB app. First I need to understand its original stack
and build a comparison loop that can tell me when the rewrite is wrong.
