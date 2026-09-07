---
title: Vibecoding a SaaS
description: Rebuilding Listenbox with Codex took three months and produced the best engineering of my life, with fast workflows, deterministic tests, tracing, and reliable CI.
---

I spent three busy months rebuilding [Listenbox](https://listenbox.app/) with
Codex. That was much longer than I expected. It also produced the best
engineering of my life. Overall, this was a positive experience, even though
I can't say it made building the SaaS less stressful.

Listenbox is audio and video podcast hosting: uploads, imports, YouTube
publishing, billing, teams, and a public API. I was the solo developer, using
frontier GPT models. This was a substantial new implementation of an existing
product.

Coding it by hand might have taken the same three months. Maybe. Writing
reliable distributed orchestration along the lines of Temporal would certainly
have taken me more than three months by hand, so the comparison also depends
on what I would have built and which infrastructure I would have used. It's
hard to put a confident number on the overall time saved.

The early progress felt ridiculous. I was showing friends what happened after
the prompt “this ugly, fix,” and yelling about a dropdown the agent built
without JavaScript. Then I spent weeks in a loop I described to the group chat
like this:

> And now it's working on it again, then another deploy, I test again, and so
> on every day.

That quote is my own, translated from Russian. The excitement was real. So was
the daily work of reviewing, debugging, and deciding what to build. I am still
awaiting Apple's HLS delivery approval, which has been pending since August 25.

The weekend SaaS pitch leaves all that work out of the estimate. Looking back
through my commits and messages, these are the lessons I want to carry into the
next project.

**The biggest gain was engineering quality.** I am 100% confident in every part
of the system because of the deterministic end-to-end testing and end-to-end
tracing we built alongside it. I've never had this level of confidence in my
own engineering before.

Local mock servers make external services controllable during tests. The
YouTube mock can exhaust quota after an exact number of requests, delay an
operation, or make the next upload fail. I can reproduce those conditions and
test how the application handles them. The traces show the work happening
throughout the system, and the tests check that the expected spans are present.

Codex also made sure CI was green and the tests weren't flaky. Getting this
level of testing, tracing, and reliable CI felt like a luxury normally reserved
for big teams. I had it as a solo developer. That is a much clearer benefit to
me than any estimate of hours saved.

**Traces helped the LLM make the system fast.** I am happy with performance as
well as correctness and determinism. My workflow is to feed a trace to the LLM
and ask it to make that path fast. If that requires rearchitecting the path,
I'm comfortable with that because the end-to-end tests let me verify the
behavior after the change.

One media storage design could put close to a thousand records into PostgreSQL
for a single upload by recording every object in the package. I had to work out
which objects actually needed individual ownership records. The upload
producing a playable result didn't answer that question.

I traced the downloads, FFmpeg processing, probes, and uploads, then gave Codex
a trace about six megabytes in size. That was when it started making useful
progress on the design. The trace exposed the actual network requests, disk
operations, waits, and work happening sequentially that could happen
concurrently. A passing test could coexist with an absurd route through the
system.

There was a similar problem after I moved background jobs from River to
Temporal. Temporal already knew when an RSS import's child jobs had finished,
but the application added another completion check using UI progress counters.
Those counters could drift and leave a completed import looking stuck. The fix
was to let Temporal determine completion. Adopting infrastructure only helps if
the application actually uses its guarantees.

**E2E tests made large changes practical from a single prompt.** I could ask for
a rearchitecture in one prompt, or a subsystem replacement in one prompt:
`rclone` to `gofakes3`, SolidStart to Inertia. The tests checked the application's
behavior through those changes. That confidence meant I could choose a better
architecture without worrying about losing what already worked.

**The test has to describe what the customer gets.** In the upgrade flow, the
API correctly rejected an import with `402 Payment Required`. The frontend's
API client turned that response into a generic `500`. The backend rule worked;
the customer still needed an explanation and a link to an eligible plan.

“Import works” also becomes much more specific when somebody cancels halfway
through, an upload succeeds but its response gets lost, or a feed is deleted
and recreated while old cleanup is running. These cases occupied a large part
of the work. A test that merely confirms a successful import leaves the
ownership, retry, and cancellation rules undecided.

Even the evidence needs checking. Asking the agent to trace everything could
leave a stage missing, so I needed assertions that the important spans existed.
The browser test environment also once shared frontend output directories with
production builds, allowing a later deploy to pick up test assets. Running tests
is useful only when their assertions and environment support the conclusion
I'm drawing from them.

**Product judgment still takes human time.** I could point the agent at
something I disliked and get another implementation quickly. I could also
spend days iterating before I was satisfied. Often I couldn't express the
criterion in advance: I had to use the thing to understand what felt wrong.

That made late feedback expensive. By the time I understood the problem, there
was already code built around a decision I wanted to change. Sometimes that
decision reached into the architecture. More generated versions didn't remove
my responsibility to choose one, explain why it was better, and decide when it
was good enough.

**Cheap implementation makes scope creep more tempting.** I expanded the
product, changed architectural decisions, and got distracted by tooling. I even
built a [static site generator](/writing/another-static-site-generator/) along
the way. Some of those tools were useful. They still consumed time that could
have gone toward a smaller first release.

The agent was equally willing to help with a new tool, a redesign, or a missing
feature. It didn't feel the difference between an interesting afternoon and an
afternoon that got Listenbox closer to a paying customer. I had to make that
choice. Blaming the model for all three months would let me off far too easily.

**$100/month of Codex is just not enough to build a SaaS like this.** I need to
budget for more Codex usage alongside my own time. Getting an implementation
quickly doesn't mean the whole project is cheap.

**Shipping depends on people and platforms too.** My definition of release in
the chat was “MRR > 0”: recurring revenue. Working checkout code was one step
toward that. Apple's approval for HTTP Live Streaming delivery runs on Apple's
calendar. Finding people who want the product requires work of its own. Those
dependencies remain even if code generation becomes instantaneous.

For the next project, I want to test five changes against one outcome: less
time getting a complete workflow into a customer's hands.

1. **Deploy one complete flow immediately, with tracing.** Put a small upload
   through the actual VPS, database, buckets, and workers. Trace it from the
   browser through background processing to the playable result, and assert
   that the important stages are present. Inspect request counts, disk writes,
   waits, and elapsed time while the flow is still small. The result I want is
   fewer architectural surprises after several features depend on the same
   pipeline.

2. **Agree on the outcome and ownership before generating the feature.** For
   an import, write down what success, partial failure, cancellation, and retry
   mean to the user. Decide which system owns completion and which objects
   cleanup may delete. Have the agent inspect the existing contracts and tests
   before proposing another mechanism. Verify the outcome through the full
   application, including the error message or recovery action the user sees.
   I want fixes to close a concrete failure instead of adding another layer
   around it.

3. **Make uncertain product decisions with something small I can use.** Try a
   rough interactive flow before asking for the whole implementation. When it
   feels wrong, identify the action or decision that caused the friction and
   turn that discovery into a requirement. I won't always know what I want
   beforehand, but I can try to discover it before it spreads through the
   backend. The test is whether fewer design iterations force architectural
   changes.

4. **Choose one path to a paying customer and hold the scope there.** Pick the
   smallest complete publishing workflow somebody would pay for. Keep new
   features and tooling ideas outside that release unless they remove an
   observed blocker. Review progress by whether that customer can get further
   through the workflow. An impressive new tool shouldn't count as progress
   toward release merely because it was easy to build.

5. **Start external dependencies early and budget my own attention.** Apply
   for platform approvals as soon as the required flow is ready to review, and
   find prospective users while development continues. Include review,
   debugging, design iteration, and waiting in the estimate. Track where my
   days go; repeated visits to the same feature should prompt a closer look at
   its requirements or design.

I would absolutely use Codex again. It helped me build a system I trust more
than anything I've engineered before, with performance I'm happy with and the
confidence to change its architecture. The surprise was that getting there
still took three months. Next time I want to keep that standard of performance,
testing, tracing, and reliable CI while giving it fewer things to build and
making product decisions earlier. Whether that gets me to a paying customer
sooner is something I still need to find out.
