# Personal website

Built with [solid-static](https://github.com/meoyawn/solid-static), the best static site generator.

GitHub Actions runs `task deploy` on every push to `master`, using the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. Deployment
requires all checks to pass, then verifies the homepage timepiece animates and
the travel island responds on `https://adelnz.com`.

The site installs the published `solid-static` release matching GitHub tag
`v0.3.16`; no sibling checkout is required.
