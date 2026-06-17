---
title: "`npm install` is extremely dangerous"
description:
  How npm install can execute malicious lifecycle scripts in recruiter repos,
  plus safer install-gate tools to look at before trusting recruiter code.
teaser: Welcome to 2026
published_at: 2026-05-29
updated_at: 2026-06-18
---

Recruiter-supplied repos are code execution until proven otherwise.

The dangerous path is usually ordinary:

```text
git clone
npm install
```

For npm projects, the install step can run lifecycle scripts from direct or
transitive dependencies before the app ever starts. A fake interview task does
not need an obvious exploit in application code. It only needs a plausible repo,
a plausible package, and a developer willing to install dependencies on a
machine that has real credentials.

## Attack vector

The pattern:

- fake recruiter, fake company (https://novachainhub.com/), or compromised
  hiring conversation
- private repo with a normal-looking engineering task
- dependency added to `package.json`, often with a bland SDK/tooling name
- stale or mismatched lockfile that hides what a fresh install will resolve
- install-time behavior through `preinstall`, `install`, `postinstall`, or
  `prepare`
- optional use of git, URL, local file, or local directory dependency specs to
  bypass normal registry review paths

The target is not only the assessment app. The target is the developer
environment around it.

## Threat model

Assume the attacker controls the repo and at least one package that may be
resolved during install.

Assume install scripts may:

- read environment variables
- read files from the working tree and home directory
- access SSH agents, npm tokens, cloud CLI state, wallet files, browser data,
  and local config
- start background processes
- make outbound network requests
- fingerprint the machine and decide whether to activate
- attempt persistence or lateral movement

Do not treat containers as a full answer by default. A container with mounted
source, mounted credentials, host networking, forwarded SSH agents, or copied
dotfiles can still expose the assets that matter.

Do not trust a checked-in lockfile by itself. If `package.json` and the lockfile
are out of sync, a lockfile-only scan can miss the package that a fresh install
would pull.

## Practical default

Do not open the repo in an editor yet. Disable workspace trust, task auto-run,
extension recommendations, and automatic dependency setup before any editor
touches the directory. Use a clean browser profile. Do not expose wallets, real
sessions, SSH agents, cloud credentials, or publish tokens to the assessment
environment.

The practical answer is not a magic npm incantation. Command-line flags change.
Package managers change defaults. Malware campaigns adapt.

The durable answer is the security shape:

- treat dependency installation as code execution
- put a malware-aware install gate in front of the package manager
- resolve and inspect dependencies before running the app
- keep lifecycle scripts disabled unless you have reviewed why a specific
  package needs one
- prefer guards that wrap the package manager already used by the project
- stop when a guard blocks, warns, or cannot explain what it is doing

## Aikido Safe Chain

https://github.com/AikidoSec/safe-chain/

Aikido Safe Chain wraps package manager traffic and checks package downloads
before they reach the machine. The important idea is that ordinary
package-manager commands pass through a local guard that can block known
malicious packages and apply package-age policy.

If Safe Chain blocks a package, stop. Do not bypass the wrapper to make the
assessment run.

## Socket Firewall Free

https://github.com/SocketDev/sfw-free

Socket Firewall Free is an explicit guard around package-manager commands. It
runs the command with network traffic filtering and blocks malicious
dependencies before installation.

Socket Firewall is an install gate, not a sandbox. It does not make a malicious
workspace safe to open in a trusted editor, and it does not turn lifecycle
scripts into harmless text.

## Nub advisory gate

https://nubjs.com/docs/install#advisory-gate

Nub can act as the installer for existing JavaScript projects. Its advisory gate
and lifecycle-script policy are interesting because they make install-time
execution explicit instead of silently trusting every dependency build script.

This is a stronger intervention than Safe Chain or Socket Firewall. Even when
Nub preserves a project's lockfile format, you are still changing the installer
that resolves, links, and enforces lifecycle policy. Do not make that the
default move for an interview repo. Use it only when wrapper-based protection is
not enough, when the project needs a lifecycle approval flow, or when you are
already comfortable validating package-manager compatibility.

The decision that should survive over time is not a specific flag. It is this:
do not run dependency build scripts unless the package, provenance, advisory
status, and reason for execution are understood.

## What still matters

These tools reduce the chance that a malicious dependency reaches execution.
They do not change the trust boundary of the machine.

Keep real credentials, browser profiles, wallets, agents, and tokens out of
scope. Treat every approved lifecycle script as code you chose to execute. If a
guard blocks, warns, or cannot explain the graph, stop and review the reason
instead of falling back to plain `npm install`.

## More reading

- https://expel.com/blog/inside-lazarus-how-north-korea-uses-ai-to-industrialize-attacks-on-developers/
- https://socket.dev/blog/contagious-interview-campaign-spreads-across-5-ecosystems
- https://socket.dev/supply-chain-attacks/north-korea-s-contagious-interview-campaign
  is Socket's live tracker for the ongoing Contagious Interview campaign, first
  discovered on March 13, 2025.
