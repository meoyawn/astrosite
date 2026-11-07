# AGENTS.md

- language: 100% TypeScript
- framework: [SolidJS](https://www.solidjs.com/) with [Vite](https://vite.dev/)

## CLI tools

- see `task --list-all` for dev server and other stuff
- never call `node`, call `aube node` instead
- never call `npx`, call `aube exec` for installed tools or `aube dlx` for
  one-off packages instead
- never run `oxfmt`
- never call `wc`, call `scc` instead (both on files and folders)
- never pass multiple paths to `scc`. Single dir/file only.
- use `gh` for github
- never give up/move on to alternatives when a `<cli>` is unavailable without
  trying `pkgx <cli>`

## Dev server

- dev server port is in [vite.config.ts](vite.config.ts), and it's likely
  running. If you really need to start it you can start it, but don't forget to
  stop it when you done

## Test content independence

- Never assert site content

## Images

- never put images in [public](public/); every local image, including social
  previews and generated source artwork, must live under [src](src/)
- always import local images through Vite so content changes invalidate its
  cache and production builds emit content-hashed asset URLs
- use `solid-static/image` for local images: `ResponsiveImage` for HTML images
  and `getImage()` for URLs used outside image markup, including Open Graph
  metadata
- never hand-copy an optimized image into `public`; keep one source asset in
  `src` and let `solid-static` optimize, cache, and emit the derivative

## i18n sync

- every edit to an original page in [src/pages](src/pages/) must begin by
  checking for matching translations in [src/pages/ru](src/pages/ru/) and
  [src/pages/tt](src/pages/tt/)
- when a matching translation exists, update every locale in the same change;
  never leave locale sync for a later task or wait for the user to request it
- before reporting completion, explicitly compare the affected original,
  Russian, and Tatar content and confirm that wording and structure remain in
  sync
- a page change is incomplete while any matching locale is stale
