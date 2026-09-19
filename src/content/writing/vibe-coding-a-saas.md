---
title: Vibe coding a SaaS
description: Rebuilding Listenbox with Codex gave me the best engineering of my life, room to experiment, and a few more rounds of fixing than I had planned.
published_at: 2026-09-08
updated_at: 2026-09-19
---

I spent three busy months rebuilding [Listenbox](https://listenbox.app) with
Codex. It produced the best engineering of my life. As a solo developer, I had fast workflows,
deterministic tests, tracing, and the confidence to change almost anything.
I could ask for a major architectural change in a sentence. Finishing still
had a way of moving further down the calendar.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Coding is solved, bugs are not yet solved. Fix incoming</p>&mdash; Boris Cherny (@bcherny) <a href="https://x.com/bcherny/status/2090649326032945591?ref_src=twsrc%5Etfw">August 21, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

Listenbox is an [audio and video podcast hosting service](https://listenbox.app) with uploads, imports,
YouTube publishing, billing, teams, and a public API. I was rebuilding an
existing product with frontier GPT models, so there was plenty to keep us busy.

The early progress felt ridiculous. I was showing friends what happened after
the prompt “this ugly, fix,” and yelling about a dropdown the agent built
without JavaScript. Being able to point at something, describe what bothered
me, and get another version to try was a delight.

Eventually my group chat updates became a little less glamorous:

> And now it's working on it again, then another deploy, I test again, and so
> on every day.

That's my own message, translated from Russian. The loop lasted weeks. I was
working hard, and some days it felt like we were fixing something we'd already
fixed. Meanwhile, I was getting a level of engineering I'd never had before.

Alongside the product, we built deterministic end-to-end tests, tracing, and
local mock servers for external services. I could tell the YouTube mock to
exhaust its quota after an exact number of requests, delay an operation, or
make the next upload fail. Then I could reproduce that situation whenever I
wanted. The traces showed what happened throughout the system, and the tests
checked that the important spans were present.

Codex also made sure CI was green and the tests weren't flaky. Getting this
level of testing, tracing, and reliable CI felt like a luxury normally reserved
for big teams. I had it as a solo developer, and I could use it every time I
wanted to try something ambitious.

That confidence made large changes practical. I could ask for a move from
SolidStart to Inertia, or a different build system, in a single prompt. The
tests let me check that the application still behaved as expected after
changing fundamental parts of it.

Performance became something I could work on the same way. One media storage
design could put close to a thousand records into PostgreSQL for a single
upload by recording every object in the package. The result played, but there
was quite a lot happening backstage. I had to work out which objects actually
needed individual ownership records.

I traced the downloads, FFmpeg processing, probes, and uploads, then gave Codex
a trace about six megabytes in size. That was when it started making useful
progress on the design. We could see the actual network requests, disk
operations, and waits, including work running sequentially that could run
concurrently. Feeding the agent a trace and asking it to make that path fast
became a useful routine. I was happy with the performance, and the tests let
me check the behavior after a substantial rewrite.

There was a similar problem after I moved background jobs from River to
Temporal. Temporal already knew when an RSS import's child jobs had finished,
but the application added another completion check using UI progress counters.
Those counters could drift and leave a completed import looking stuck. We
eventually let Temporal determine completion. It was already doing the job;
we'd given it an unnecessary assistant.

Getting to that simpler design took repeated attempts. So did working out what
the tests needed to prove. In the upgrade flow, the API correctly rejected an
import with `402 Payment Required`, but the frontend turned it into a generic
`500`. The customer needed an explanation and a link to an eligible plan. We
had to follow the result all the way to the person using it.

“Import works” also becomes much more specific when somebody cancels halfway
through, an upload succeeds but its response gets lost, or a feed is deleted
and recreated while old cleanup is running. These cases occupied a large part
of the work. I still had to decide what should happen, even when writing the
implementation was quick.

One early cancellation test didn't reliably establish that there was work to
cancel. Later versions checked that precondition and verified that the API
actually stopped the child workflows. Each discovery gave us a better test,
although I would happily have skipped a few of the discoveries.

The machinery around the tests had its own adventures. The browser test
environment once shared frontend output directories with production builds,
allowing a later deploy to pick up test assets. Even the setup that gave me
confidence needed some attention.

On September 19, I looked back at the parts of the system we kept changing.
The familiar names came up: job lifecycles, media ownership and cleanup, and
the development and test setup. Our Temporal lifecycle work stretched from
August 8 to September 1. That helped explain where the weeks had gone. Some
of my confidence now came from tests we'd learned to write the hard way.

I was also discovering what I wanted the product to be. Often I couldn't
describe a better interface in advance; I had to use it to understand what
felt wrong. Being able to try another version quickly helped enormously. I
could explore an idea instead of spending the afternoon wondering whether it
was worth implementing.

Sometimes I spent days on those iterations. By the time I understood the
problem, there could already be backend code built around a decision I wanted
to change. The ability to change it was wonderful. Choosing a version and
calling it finished was still my job.

And with so many things suddenly practical, I found plenty more things to
build. I expanded the product, changed architectural decisions, and even wrote
a static site generator along the way. Some of those tools were useful. They
also help explain why this wasn't a weekend project. The agent was equally
happy to help with a feature, a redesign, or a detour. I supplied a few of the
detours myself.

Coding it by hand might have taken the same three months. Maybe. Writing
reliable distributed workflows would certainly have taken me more than three
months by hand. I also wouldn't necessarily have attempted the same things.
That makes the hours-saved calculation difficult. The quality of what I ended
up with is much easier to appreciate. A $100 monthly Codex budget wasn't enough
for this project, so next time I'll budget for more usage as well as my time.

When I first wrote this on September 8, I was still waiting for approval to
deliver video to Apple Podcasts via HTTP Live Streaming (HLS). The request had been pending
since August 25. Apple, understandably, hadn't joined my prompting session.
There were still platform approvals to wait for and prospective customers to
talk to.

Next time, I'll start with a real person on a call or in an email thread:
someone with a goal and a budget for achieving it. I want us to have a clear
picture of the outcome they need. A SaaS has an opinion about how to get
there, and we can work out that process together. Their desired outcome gives
the whole project its direction.

Then I want to keep moving toward it, letting that outcome guide every
feature, rewrite, and afternoon of work. The traces, production setup, and
end-to-end tests help me deliver it reliably. They earn their place by helping
that person get what they came for.

I would absolutely use Codex again. I'm delighted to have this much engineering
within reach, and I want to put it behind a customer whose goal I understand.
My definition of release in the chat was “MRR > 0”: someone paying each month
for the outcome the product helps them achieve. That's where I want this
story to start next time.
