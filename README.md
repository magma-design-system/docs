# Magma docs

Documentation site for Magma, the Maggioli Group Design System, published at
https://magma-design-system.github.io/docs/.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build),
statically, from the **published** Magma packages installed in `node_modules`.

## Working on the site

[`AGENTS.md`](AGENTS.md) holds the rules of this repository and a map of the code, and
[`agents/`](agents/) the details: how each part is built, writing pages, styling, workflow
and publishing, Magma's open issues and the site's workarounds, patterns. They are written
for coding agents (Claude Code reads them through `CLAUDE.md`) and are just as useful to
people. [`plan/`](plan/) holds the decisions ([`CONTENT_STRUCTURE.md`](plan/CONTENT_STRUCTURE.md),
[`DIRECTION.md`](plan/DIRECTION.md)) and the open work ([`BACKLOG.md`](plan/BACKLOG.md)).
Whoever learns something the next person needs writes it there, in the same pull request.

## Rule: read Magma only from node_modules

The site never reads the Magma monorepo. Everything comes from the npm packages, exactly as
a consumer gets them. Anything the site needs and cannot find there is a Magma packaging
bug: track it in [#1](https://github.com/magma-design-system/docs/issues/1).

All Magma access goes through [`src/lib/magma.mjs`](src/lib/magma.mjs).

## Magma in the page

The site loads Magma the way a consumer does:

- [`src/styles/magma.css`](src/styles/magma.css): normalize, fonts and Magma styles in the
  cascade layer order of the Magma install guide, with Starlight's layer placed between
  Magma's base and component layers, and Tailwind v4 set up as in Magma's Storybook:
  Tailwind's theme and utilities (no preflight) with Magma's theme, so Magma's classes work
  (`gap-400` is 1rem, `grid-cols-full`, `w-full`, ...). The frame is styled with these
  utilities and Magma's tokens (breakpoints `tablet` and `desktop`, the spacing scale,
  semantic colors); the few rules left in `magma.css` target markup the site does not
  render itself (`<body>`, page content, Starlight's elements), in the `components`
  layer, so a utility class overrides them.
- [`src/scripts/magma.ts`](src/scripts/magma.ts): the lazy loader (`defineCustomElements`),
  the icon path (`IconsSetService`) and Starlight's `data-theme` kept on the scheme chosen
  with `mds-pref-mode`.
- [`src/integrations/magma.mjs`](src/integrations/magma.mjs): injects that script into
  every page and runs [iconsauce](https://www.npmjs.com/package/@iconsauce/core) as Magma
  does: every icon of its sets (`mi/<variant>/<name>`, `mdi/<name>`, `mgg/<name>`, and
  `lobe/<name>` for AI brand logos) is copied to `public/svg/` (gitignored), where
  `<mds-icon name="...">` fetches it, since the Icons pages show whole sets. The sets are in
  [`iconsauce.config.mjs`](iconsauce.config.mjs); the copy is skipped when they did not
  change. It also renders Markdown tables as `mds-table`
  ([`src/lib/markdown-tables.mjs`](src/lib/markdown-tables.mjs)), cells on one line
  (`whitespace-nowrap`): the table takes the width of the page and `mds-table` scrolls
  it sideways, instead of squeezing its columns. The component pages build their tables
  with `mds-table` the same way.

## Frame

Starlight is the engine (routing, content, i18n, search); the frame around the content is
built with Magma components, following the layout decisions in `plan/CONTENT_STRUCTURE.md`
(added by [#3](https://github.com/magma-design-system/docs/pull/3)). The overrides are in
[`src/components/frame/`](src/components/frame/), listed in `astro.config.mjs`:

- **Rail** (desktop): brand, search, the 10 sections as `mds-button` links, the repository
  and Storybook links, and the preferences (`mds-pref` with mode, language and theme) in a
  dropdown. It collapses to icons with tooltips; the state is kept in `localStorage`.
- **Section navigation**: the pages of the current section, first column of the card.
- **Right column**: on component pages, the "Documentation" column with the component's
  sub-pages; elsewhere, the table of contents with a reading indicator (a vertical
  `mds-progress`).
- **Mobile header** (below 64rem): `mds-header` with the brand; its menu holds the
  sections, the component sub-pages, the section navigation and the preferences. The right
  column stays down to 48rem.
- **Page footer**: who modified the page last and who created it, from the editorial
  commits of its source file ([`src/lib/history.mjs`](src/lib/history.mjs)), and a button
  to edit the page on GitHub. Names and roles come from
  [`src/content/authors.json`](src/content/authors.json), keyed by GitHub login: add
  yourself there with your first page. CI fails on a page author missing from it and says
  what to add (`npm run check:authors`). Pages generated from Magma (the components) have
  no footer. The deploy workflow fetches the whole history (`fetch-depth: 0`): in a shallow
  clone the footer leaves out the authors.

The sections are defined once in [`src/lib/nav.mjs`](src/lib/nav.mjs), which builds
Starlight's sidebar: one group per section, the first item is where the rail links. Each
component has a main page and the sub-pages its `documentation.json` data allows (API, CSS,
Pattern, Antipattern): [`src/lib/components.ts`](src/lib/components.ts). The three usage files
are the component's prose: Description on the main page, then the Pattern and Antipattern
sub-pages. The readme is not shown: it holds a generic intro only.

## Languages

English is the default locale, at the site root; Italian is under `/it/`. Locales are
defined in [`src/lib/i18n.mjs`](src/lib/i18n.mjs). UI strings live in one dictionary per
locale, [`src/content/i18n/<lang>.json`](src/content/i18n/), and are read with
`Astro.locals.t()`: never hard-code them in components. Pages are translated by adding the
same path under `src/content/docs/<locale>/`; missing pages and strings fall back to
English. Text generated from the Magma packages is English only.

To add a locale: one entry in `locales` plus its `src/content/i18n/<lang>.json`.

## Develop

```bash
npm ci
npm run dev
```

Formatting follows the Magma monorepo's Prettier config (`.prettierrc`), with the Astro
plugin: `npm run format` writes, `npm run format:check` checks.

The site is served under `/docs/` (see `base` in `astro.config.mjs`).

## Test against unreleased Magma changes

Use a prerelease with a dist-tag, or pack the package in the monorepo and install the
tarball here:

```bash
npm install ../magma/projects/stencil/maggioli-design-system-magma-2.0.2.tgz
```

Never use `npm link`: symlinks hide exactly the packaging bugs this site is meant to catch.

## Deploy

`.github/workflows/deploy.yml` type-checks and builds every pull request, and deploys the
`production` branch to GitHub Pages with `withastro/action`. Work goes into `main` through
pull requests; to publish, open a pull request from `main` to `production` and merge it.
`production` only takes pull requests, and the `github-pages` environment only accepts
deployments from it.
