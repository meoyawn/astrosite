---
title: Vibe coding a SaaS
description: Three months rebuilding Listenbox with Codex brought exhilarating progress, stubborn bugs, and the best engineering of my life. Finishing was another skill.
published_at: 2026-09-08
updated_at: 2026-09-19
---

Early in rebuilding [Listenbox](https://listenbox.app) with Codex, I was
showing friends what happened after the prompt “this ugly, fix,” and yelling
about a dropdown the agent built without JavaScript. I could point at
something, describe what bothered me, and get another version to try. The
progress felt ridiculous.

Three busy months into the rebuild, I had the best engineering of my life:
fast workflows, deterministic tests, tracing, and the confidence to change
almost anything. I also had weeks of group chat updates like this:

> And now it's working on it again, then another deploy, I test again, and so
> on every day.

That's my own message, translated from Russian. I was working hard, and some
days it felt like we were fixing something we'd already fixed. I kept
underestimating how much work remained after something first worked.

Listenbox is an [audio and video podcast hosting service](https://listenbox.app)
with uploads, imports, YouTube publishing, billing, teams, and a public API.
I was rebuilding an existing product with frontier GPT models. A working
dropdown was a wonderful early win. An import that behaved sensibly through
failures, retries, cancellation, and billing limits would occupy us for much
longer.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Coding is solved, bugs are not yet solved. Fix incoming</p>&mdash; Boris Cherny (@bcherny) <a href="https://x.com/bcherny/status/2090649326032945591?ref_src=twsrc%5Etfw">August 21, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

Alongside the product, we built deterministic end-to-end tests, tracing, and
local mock servers for external services. I could tell the YouTube mock to
exhaust its quota after an exact number of requests, delay an operation, or
make the next upload fail. Then I could reproduce that situation whenever I
wanted. The traces showed what happened throughout the system, and the tests
checked that the important spans were present.

Codex also made sure CI was green and the tests weren't flaky. As a solo
developer, this felt like a luxury normally reserved for big teams. I could
reproduce a frustrating failure, investigate it, and check whether a fix held.

That confidence made large changes practical. I could ask for a move from
SolidStart to Inertia, or a different build system, in a single prompt. The
tests let me check that the application still behaved as expected after
changing fundamental parts of it.

That mattered when a media storage design could put close to a thousand
records into PostgreSQL for a single upload by recording every object in the
package. The result played, but a single upload came with an awful lot of
bookkeeping. I had to work out which objects actually needed individual
ownership records.

I traced the downloads, FFmpeg processing, probes, and uploads, then gave Codex
a trace about six megabytes in size. That was when it started making useful
progress on the design. We could see the actual network requests, disk
operations, and waits, including work running sequentially that could run
concurrently. Feeding the agent a trace and asking it to make that path fast
became a useful routine. I was happy with the performance, and the tests let
me check the behavior after a substantial rewrite. Next time I hit a problem
like this, I want to collect that evidence earlier: a trace gave us specific
work to remove or rearrange.

There was a similar problem after I moved background jobs from River to
Temporal. Temporal already knew when an RSS import's child jobs had finished,
but the application added another completion check using UI progress counters.
Those counters could drift and leave a completed import looking stuck. We
eventually let Temporal determine completion. It was already doing the job;
we'd given it an unnecessary assistant.

Getting to that simpler design took repeated attempts. Having a good workflow
engine hadn't spared us from building the wrong thing around it.

Trusting the tests took work too. In the upgrade flow, the API correctly
rejected an import with `402 Payment Required`, but the frontend turned it
into a generic `500`. The customer needed an explanation and a link to an
eligible plan. A test that stopped at the correct API response would leave
the person using the product at a dead end.

“Import works” also becomes much more specific when somebody cancels halfway
through, an upload succeeds but its response gets lost, or a feed is deleted
and recreated while old cleanup is running. These cases occupied a large part
of the work. I still had to decide what should happen, even when writing the
implementation was quick.

One early cancellation test didn't reliably establish that there was work to
cancel. Later versions checked that precondition and verified that the API
actually stopped the child workflows. Even proving that cancellation worked
needed another round of fixing. Each discovery gave us a better test, although
I would happily have skipped a few of the discoveries.

The machinery around the tests had its own adventures. The browser test
environment once shared frontend output directories with production builds,
allowing a later deploy to pick up test assets. Even the setup that gave me
confidence needed some attention.

On September 19, I looked back at the parts of the system we kept changing.
The familiar names came up: job lifecycles, media ownership and cleanup, and
the development and test setup. Our Temporal lifecycle work stretched from
August 8 to September 1. That helped explain where the weeks had gone. Some
of my confidence now came from tests we'd learned to write the hard way.

Before trusting a test, I need to check what situation it actually creates and
follow the result through to the customer.
For cancellation, there must be work running, and it must stop. For an upgrade,
the customer must understand what happened and how to continue. Those are
product decisions I still have to make, even when Codex writes the tests.

Meanwhile, I was still discovering what I wanted the product to be. Often I
couldn't describe a better interface in advance; I had to use it to understand
what felt wrong. Being able to try another version quickly helped enormously.
I could explore an idea instead of spending the afternoon wondering whether
it was worth implementing.

Sometimes I spent days on those iterations. By the time I understood the
problem, there could already be backend code built around a decision I wanted
to change. The ability to change it was wonderful. Choosing a version and
calling it finished was still my job.

And with so many things suddenly practical, I found plenty more things to
build. I expanded the product, changed architectural decisions, and even wrote
a static site generator along the way. Some of those tools were useful. They
also help explain why this wasn't a weekend project. The agent was equally
happy to help with a feature, a redesign, or a detour. I supplied a few of the
detours myself. Every individual change could feel like progress while the
release kept moving further away.

I can't give an honest hours-saved calculation. Coding a smaller version by
hand might have taken the same three months. Writing these reliable
distributed workflows would certainly have taken me longer. I wouldn't
necessarily have attempted the same things at all. The quality of what I ended
up with is much easier to appreciate. A $100 monthly Codex budget wasn't enough
for this project, so next time I'll budget for more usage as well as my time.

Next time, I'll start with a real person on a call or in an email thread:
someone with a goal and a budget for achieving it. I want us to have a clear
picture of the outcome they need and the smallest version they could use to
achieve it. We can work out that process together and agree on what can wait.
I need a way to finish while I can still see a dozen things I'd enjoy
improving.

If you're building this way, ask which part of your customer's outcome each
tempting rewrite makes possible or more reliable.
The traces, production setup, and end-to-end tests earned their place when
they helped me find failures and check repairs. An experiment can be worth
doing too, but I want to decide how much time to give it before another
afternoon disappears into it.

I would absolutely use Codex again. I'm delighted to have this much engineering
within reach, and I want to put it behind a customer whose goal I understand.
My definition of release in the chat was “MRR > 0”: someone paying each month
for the outcome the product helps them achieve. Next time, I want that person's
goal to guide the first prompt, and their ability to achieve it to tell me
when to ship. There will still be another dropdown I'd love to fix.
