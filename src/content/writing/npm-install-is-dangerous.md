---
title: "`npm install` is extremely dangerous"
description: How npm install can execute malicious lifecycle scripts in recruiter repos, plus safer npm, pnpm, and Bun workflows.
teaser: Welcome to 2026
published_at: 2026-05-29
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

## Checklist

Do not open the repo in an editor yet. Disable workspace trust, task auto-run,
extension recommendations, and automatic dependency setup before any editor
touches the directory. Use a clean browser profile. Do not expose wallets, real
sessions, SSH agents, cloud credentials, or publish tokens to the assessment
environment.

Use npm 11.10.0 or newer for this workflow. The `--allow-*` controls below are
part of npm's newer install-source restrictions; npm 10 and older are not
acceptable for this checklist.

Use a strict no-lifecycle lock generation step before any install:

```sh
npm install \
  --package-lock-only \
  --ignore-scripts \
  --no-audit \
  --no-fund \
  --allow-git=none \
  --allow-file=none \
  --allow-directory=none \
  --allow-remote=none \
  --registry=https://registry.npmjs.org/
```

What this does:

- resolves `package.json` ranges into a fresh `package-lock.json`
- does not create `node_modules`
- does not run `preinstall`, `install`, `postinstall`, or `prepare`
- rejects dependency specs that resolve from git repos, remote tarball URLs,
  local tarball files, and local directories
- gives scanners the dependency tree that `npm install` would have tried to use

If that command fails, stop and review why. Do not "just run npm install" to get
unstuck.

Scan the generated lock against multiple malware and vulnerability sources. For
cloud-backed tools, pass files instead of `.` so the upload boundary is
`package.json` and `package-lock.json`, not the whole repo:

```sh
socket scan create --tmp --report package.json package-lock.json
osv-scanner scan source --lockfile=package-lock.json
trivy fs --scanners vuln --include-dev-deps package-lock.json
npm audit --json --package-lock-only
tmpdir="$(mktemp -d)"
cp package.json package-lock.json "$tmpdir"/
(
  cd "$tmpdir" &&
    semgrep ci --supply-chain --dry-run
)
```

Socket uploads the specified manifest and lockfile targets. `npm audit` submits
dependency names and versions, and may fall back to submitting the full
`package-lock.json` dependency tree plus npm, Node, platform, architecture, and
`node_env` metadata. The Semgrep command runs from a temporary directory that
contains only the npm manifest and lockfile, and `--dry-run` prevents uploading
scan results to Semgrep AppSec Platform. Do not add Socket `--reach`, Semgrep
`--allow-local-builds`, or any directory target unless you deliberately accept
source-code scanning or local build execution.

For a monorepo, run this at every npm package root. If the repo uses npm
workspaces, start at the workspace root. If it has multiple independent
`package-lock.json` files, scan each generated lock. Keep passing explicit
manifest and lockfile paths; do not point cloud scanners at the repo root unless
you intend to upload every supported manifest they find.

Only after that should installation be considered, and even then:

```sh
npm ci --ignore-scripts
```

Enable lifecycle scripts only when you understand exactly which package needs
them and why. Native modules, browser drivers, and package managers often use
install scripts for legitimate reasons. That does not make them safe to run
blindly in an interview repo.

The practical default is simpler: isolate the repo, generate and scan a fresh
lockfile before installing, install with scripts disabled, and only enable a
script after reviewing why it is needed. Keep real credentials, browser
profiles, wallets, agents, and tokens out of scope.

## Avoid `npm install`

`pnpm` and `bun` are better defaults than plain `npm install`, but they are not
sandboxes. Treat custom lifecycle scripts as executable code, even when the
package manager blocks most dependency scripts by default.

### `pnpm install`

For pnpm, prefer pnpm 11 or newer. From a freshly cloned repo, the question is
not "will this app run?" yet. The question is "what would this install try to
resolve, and can I inspect that without running package scripts?"

```sh
pnpm install \
  --lockfile-only \
  --ignore-scripts \
  --config.registry=https://registry.npmjs.org/ \
  --config.strictDepBuilds=true \
  --config.dangerouslyAllowAllBuilds=false \
  --config.blockExoticSubdeps=true \
  --config.minimumReleaseAge=1440
```

That gives you a fresh `pnpm-lock.yaml` without creating `node_modules` or
running lifecycle scripts. `strictDepBuilds` makes unreviewed build scripts a
hard stop instead of background noise. `dangerouslyAllowAllBuilds=false` keeps
the default deny posture. `blockExoticSubdeps=true` rejects git, URL, local
file, and local directory dependency specs in transitive dependencies.
`minimumReleaseAge=1440` avoids packages published in the last 24 hours.
`registry` avoids a repo-local registry override.

If the lockfile generation fails, stop and inspect the failure. Do not switch to
plain `pnpm install` to get unstuck.

Only after scanning the generated lockfile should you install dependencies, and
even then keep scripts off:

```sh
pnpm install \
  --frozen-lockfile \
  --ignore-scripts \
  --config.registry=https://registry.npmjs.org/ \
  --config.strictDepBuilds=true \
  --config.dangerouslyAllowAllBuilds=false \
  --config.blockExoticSubdeps=true \
  --config.minimumReleaseAge=1440
```

Enable a package build script only after reviewing the package and the exact
script it wants to run. Do not use `pnpm approve-builds --all` in an untrusted
repo.

### `bun install`

For Bun, use the same shape: resolve first, inspect next, install only after
that. Generate the lockfile without installing packages and without running
project scripts:

```sh
bun install \
  --lockfile-only \
  --ignore-scripts \
  --registry=https://registry.npmjs.org/ \
  --minimum-release-age=259200
```

Bun does not run dependency lifecycle scripts by default, but project lifecycle
scripts can still run unless you pass `--ignore-scripts`. The release-age flag
rejects packages published in the last three days. The registry flag overrides
repo-local `.npmrc` and `bunfig.toml` registry settings.

If that lockfile generation fails, stop and inspect why. Do not use
`bun add --trust` as a shortcut around the failure.

After scanning the generated lockfile, install with the lockfile pinned and
scripts still disabled:

```sh
bun install \
  --frozen-lockfile \
  --ignore-scripts \
  --registry=https://registry.npmjs.org/ \
  --minimum-release-age=259200
```

Only add a package to `trustedDependencies` after reviewing why its lifecycle
script is required. In a recruiter repo, treat every trusted dependency entry as
code you have chosen to execute.

## More reading

- [Inside Lazarus: How North Korea uses AI to industrialize attacks on developers](https://expel.com/blog/inside-lazarus-how-north-korea-uses-ai-to-industrialize-attacks-on-developers/)
- [North Korea's Contagious Interview Campaign Spreads Across 5 Ecosystems, Delivering Staged RAT Payloads](https://socket.dev/blog/contagious-interview-campaign-spreads-across-5-ecosystems)
- [North Korea's Contagious Interview Campaign](https://socket.dev/supply-chain-attacks/north-korea-s-contagious-interview-campaign) is Socket's live tracker for the ongoing Contagious Interview campaign, first discovered on March 13, 2025.
- [pnpm: Mitigating supply chain attacks](https://pnpm.io/supply-chain-security)
