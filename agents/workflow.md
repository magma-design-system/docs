# Workflow

## Dev server

- `npm run dev` serves http://localhost:4321/docs/. In a shell without a terminal (an agent's),
  Astro 7 starts it in the background: `npx astro dev logs` reads its output,
  `npx astro dev stop` stops it. A second server on the same project needs
  `--ignore-lock --port <n>`.
- Restart it after editing `astro.config.mjs`, `src/lib/nav.mjs`, `src/content/i18n/*.json` or
  `src/integrations/`, and after any `npm install`.
- After editing `src/lib/markdown-text.mjs` or `markdown-tables.mjs`, start it with `--force`:
  Astro caches the rendered Markdown (`.astro/data-store.json`). The same goes for a build.
- "A Magma component disappeared": the dev server's optimized dependencies are stale (the
  network tab shows `504 Outdated Optimize Dep`), the component never hydrates and Magma keeps
  it hidden. It happens the first time a page uses a component no page loaded before, and after
  a build or check on the same checkout. Reloading does not help; restarting the server does.

## Verifying a change

Never run `build` or `check` in a checkout where someone's dev server is running (see above).
Verify in a separate worktree, with its own `node_modules`:

```bash
git worktree add --detach "$TMP/wt" HEAD
cd "$TMP/wt" && npm ci
npx astro check
npx astro build --outDir "$TMP/site/docs"
python3 -m http.server 4440 --directory "$TMP/site"
```

Then open http://localhost:4440/docs/. Notes:

- Uncommitted changes are not in the worktree: copy them over, or commit first.
- A symlinked `node_modules` breaks the Vite build ("No cached compile metadata"): run `npm ci`.
- The first build dumps about 17,000 icons into `public/svg/` and can take minutes; the next
  ones skip the copy.
- A production build is not dev: drafts and previews of draft patterns are left out.
- `astro check` must end with 0 errors: CI runs it before the build.

In a browser driven by an agent (a hidden or embedded pane):

- Clipboard writes may be denied: stub `navigator.clipboard.writeText` to test copy buttons.
- A hidden pane throttles `requestAnimationFrame` and transitions: animations look stuck and
  computed colors stale. Sample over time, or read the custom property values.
- It can stop `requestAnimationFrame` altogether, the tab in front included: Stencil then never
  re-renders, so a prop set from JavaScript reaches neither the attribute nor the shadow DOM (an
  element enabled with `disabled = false` stays disabled, a tip stays). Count a few
  `requestAnimationFrame` callbacks before trusting what a re-render should change, and check
  it in headless Chrome over the DevTools Protocol (as `scripts/screenshots.mjs` drives it) or
  in a browser on screen. Three findings of October 2026 came from such a pane and did not
  reproduce in Chrome: `mds-button` and `mds-input` that stay disabled, and magma#1147, the bar
  of `mds-header` that keeps `nav="desktop"` on its attribute after the header hands it
  `nav="all"`.
- Lazy `mds-img` never loads in a hidden pane.
- A hidden pane has `innerHeight` 0 until a viewport size is set, and runs no `ResizeObserver`:
  where a page opens (`#fragment`, back and forward, reload) is measured in headless Chrome.
- Clicks on `mds-modal` content can miss while it animates: click from JavaScript.
- `InvalidStateError` from the router in the console means a view transition was skipped in a
  hidden tab: harmless.

### Firefox (macOS)

Firefox has no `corner-shape`, so it shows what a fallback looks like. To drive it headless:
`open -n -g -a Firefox --args -headless -no-remote -profile "$(mktemp -d)" -remote-debugging-port 9333`
(started directly, it may fail to find its profile folder), then WebDriver BiDi over a
WebSocket (Node's global `WebSocket`): `browsingContext.create`, `script.evaluate`,
`browsingContext.captureScreenshot`.

## Git and pull requests

- Branch from `main`: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- Conventional Commits (`feat(icons): ...`, `fix(frame): ...`), one topic per commit. A rename
  is a commit of its own ([writing.md](writing.md)).
- `npm run format:check` before pushing (CI does not run it).
- Pull request to `main`. CI (`.github/workflows/deploy.yml`, job `build`: `npm ci`,
  `astro check`, build) must be green; the job `authors` is a signal (below). Maintainers
  review and merge; agents never merge.
- **Merging**: content pull requests are merged with "Create a merge commit", which keeps the
  author of each commit: the page footer shows them. A squash merge would make the pull
  request's author the author of every page it touches, the others only `Co-authored-by`
  trailers. Squash stays enabled for Renovate, whose pull requests merge themselves (GitHub
  auto-merge).

### Page authors

The job `authors` runs on pull requests only:
`npm run check:authors -- --base origin/<base branch>`
([`scripts/check-authors.mjs`](../scripts/check-authors.mjs)). It checks the pages the pull
request changes (`git diff <base>...HEAD`, English and Italian), and `authors.json` when it
changes too. It turns red when an author those page footers show is missing from
`src/content/authors.json`, or has no name or role; its log and job summary list each one with
the pages and the entry to paste. Locally, `npm run check:authors` checks every page. It needs
the whole history (it fails in a shallow clone).

It is a signal, not a gate: no status check is required to merge, and `deploy` does not depend
on it, so a push to `production` always deploys. A pull request that changes no page
(Renovate's) passes. The publication pull request `main` -> `production` holds every page
change not published yet, so it flags again every author still missing right before
publishing.

A new author, step by step:

1. Their pull request turns red on "Page authors", with the entry to paste in the summary.
2. Merge it anyway, or add the entry in the same pull request.
3. A maintainer adds the entry, with the role, to `src/content/authors.json` (any pull
   request).
4. The next publication (pull request `main` -> `production`) shows the name and the role.
   Until then the page shows the git name without a role. The authors are read at build time:
   no page needs touching.

- Prefer few pull requests, each complete, over stacks of pull requests based on each other.
- Renovate opens the dependency updates (`.github/renovate.json`, Dependency Dashboard issue).

## Publishing

- `main` is not online: `production` is. To publish, open a pull request `main` -> `production`;
  merging it runs the `deploy` job. `production` takes pull requests only, and the
  `github-pages` environment deploys from `production` only.
- **Publish check**, on a production build of `main` before opening that pull request, and on
  the live site after the deploy:
  - Building blocks and Patterns exist only as their landing pages, with the "Under
    construction" banner; no pattern page and no `/example/pattern/<id>/` is built; their home
    cards carry the badge.
  - No placeholder text, no dev-only page.
  - The Magma version in the site footer is the one in `package.json`.

## Upgrading Magma

1. Bump `magma`, `magma-react` and `magma-angular` together (same version), and
   `design-tokens`, `styles`, `identity` to the versions `magma` depends on. Right after a
   release the npm CDN can lag: `npm install --prefer-online`.
2. Read the `CHANGELOG.md` of each package.
3. Find the workarounds for issues the release fixes (search the code for
   `magma/issues/<n>`, see [magma.md](magma.md)) and remove them; update `magma.md`.
4. Build with `--force` in a worktree and check the pages the changes touch.
5. Tell whoever runs a dev server on the checkout to restart it.
