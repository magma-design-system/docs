# Agent guide: Magma docs

This repository is the documentation site of Magma, the Maggioli Group design system, published
at https://magma-design-system.github.io/docs/. It is a static Astro + Starlight site built from
the **published** Magma packages in `node_modules`, and its frame and content are made of Magma
components. It doubles as Magma's first real consumer: what the site cannot do with the
packages is a Magma bug.

This file holds the rules and the map; the details are in [`agents/`](agents/). Claude Code
reads it through `CLAUDE.md`. People start from [`README.md`](README.md).

The repository is **public**: never commit internal product code or data, credentials, private
links or personal data.

## Rules

1. **Magma only from `node_modules`.** Never import or read the Magma monorepo: every access
   goes through [`src/lib/magma.mjs`](src/lib/magma.mjs) (`resolveMagma()`). Something the site
   needs and the packages lack is a Magma packaging bug: report it
   ([agents/magma.md](agents/magma.md)), never copy it in.
2. **Never `npm link`.** Symlinks hide the packaging bugs this site is meant to catch. Test
   unreleased Magma with a prerelease or a packed tarball (README).
3. **Magma components for everything on the page**, text included: `mds-text`, `mds-list`,
   `mds-table`, `mds-banner`, `mds-button`, `mds-link`, ... Markdown is converted for you; in
   `.astro` files write them by hand. Where Magma has no component (`ol`, code block, `dl`), use
   the native element and record the gap: never build a lookalike. See
   [agents/writing.md](agents/writing.md).
4. **Tailwind utilities and Magma tokens** for everything the site styles: no literal colors or
   sizes, no `<style>` blocks in components. The Tailwind scale here is Magma's, not
   Tailwind's: read [agents/styling.md](agents/styling.md) before writing classes.
5. **Every UI string in `src/content/i18n/<lang>.json`**, never hard-coded; every page in
   English (`src/content/docs/`) and Italian (`src/content/docs/it/`).
6. **A workaround for a Magma bug cites its issue** in a comment
   (`https://github.com/magma-design-system/magma/issues/<n>`), and goes away when the release
   that fixes it is adopted.
7. **ASCII in every file**: no typographic dashes, curly quotes or non-breaking spaces. The only
   exception: accented letters in Italian pages and in `it.json`.
8. **Original words.** Guidelines are written here, never adapted from other design systems'
   docs. Other design systems are described as a trend, never named. A choice is presented on
   the site only once it is true ([plan/DIRECTION.md](plan/DIRECTION.md)).
9. **Git**: a branch per change, Conventional Commits, a pull request to `main`. Never push to
   `production` and never merge: maintainers merge, and a pull request `main` -> `production`
   publishes. See [agents/workflow.md](agents/workflow.md).
10. **Leave the knowledge here.** When you learn something the next person will need (a trap, a
    decision, a workaround, a Magma finding, an open question), write it in the right file of
    `agents/` or `plan/` in the same pull request. Knowledge kept only in a chat or in an
    agent's private memory is lost to the team.

## Commands

Node >= 24 (`.nvmrc`), npm only.

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `npm ci`         | Install                                                   |
| `npm run dev`    | Dev server at http://localhost:4321/docs/                 |
| `npm run check`  | `astro check`: types; CI fails on any error               |
| `npm run build`  | Static build into `dist/`, as CI and the deploy do        |
| `npm run format` | Prettier (the Magma monorepo config); `format:check` only |

Before running them, know the traps (details in [agents/workflow.md](agents/workflow.md)):

- `build` and `check` rewrite `node_modules/.vite/deps`: a dev server running on the same
  checkout then answers 504 for Magma's chunks and the components stay hidden until it is
  restarted. Never run them next to someone's dev server: verify in a separate worktree.
- The dev server reads `astro.config.mjs`, `src/lib/nav.mjs` and `src/content/i18n/*.json`
  once, at start: restart it after editing them. After a change to the Markdown plugins
  (`src/lib/markdown-*.mjs`), start it with `--force`: Astro caches the rendered Markdown.

## Map

| Path                                                 | What                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `astro.config.mjs`                                   | Starlight setup, the frame overrides, `base: '/docs'`                                   |
| `src/lib/nav.mjs`                                    | The 11 rail sections and their navigation (Starlight's sidebar), `soon`, drafts         |
| `src/lib/magma.mjs`                                  | The only door to the Magma packages                                                     |
| `src/lib/tokens.mjs`, `icons.mjs`, `identity.mjs`    | Data of the Tokens, Icons and Brand assets sections, read from the packages             |
| `src/lib/changelog.mjs`                              | The releases of the Changelog page, from the CHANGELOG.md of the packages               |
| `src/lib/covers.mjs`                                 | The covers of `public/covers/` and the generated avatars, for the Media kit             |
| `src/lib/markdown-text.mjs`, `markdown-tables.mjs`   | Markdown rendered as Magma components; `KIND`, `TEXT`, `READING` for `.astro` pages too |
| `src/integrations/magma.mjs`                         | Client script on every page, iconsauce icon dump, the Markdown plugins                  |
| `src/styles/magma.css`                               | Magma's CSS in cascade layer order, Tailwind with Magma's theme, the few site rules     |
| `src/scripts/magma.ts`                               | Client: component loader, icon path, mode and theme sync                                |
| `src/components/frame/`                              | Starlight overrides: rail, section navigation, right column, header, footers            |
| `src/components/`, `src/components/home/`            | Page components; the bands of the home page                                             |
| `src/loaders/components.ts`, `src/lib/components.ts` | Component pages from `magma/dist/documentation.json`                                    |
| `src/pages/`                                         | Generated routes: component, icon and brand pages, downloads, favicons, preview iframes |
| `src/patterns/<id>/`                                 | Pattern code: `example.html`, `react.tsx`, `angular.ts`                                 |
| `src/previews/`, `src/lib/previews.ts`               | Demos of the component previews, in place of Magma's example; the stage of each one     |
| `src/content/docs/`                                  | Pages: English at the root, Italian under `it/`                                         |
| `src/content/i18n/`, `src/content/authors.json`      | UI strings per locale; names and roles of the page footer, by GitHub login              |
| `public/covers/`                                     | Covers of the site for other sites and link previews (`og:image`), stable URLs          |
| `public/previews/`                                   | Images and video of the demos (CC0 or Maggioli's own; sources in architecture.md)       |
| `plan/`                                              | Decision records and open work                                                          |

## Guides

| File                                                   | Read it when                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [agents/architecture.md](agents/architecture.md)       | You need to know how a part of the site is built and where its data comes from |
| [agents/writing.md](agents/writing.md)                 | You write or move a page, a UI string, a navigation entry                      |
| [agents/styling.md](agents/styling.md)                 | You write classes or CSS                                                       |
| [agents/workflow.md](agents/workflow.md)               | You run, verify, commit, open a pull request, upgrade Magma or publish         |
| [agents/magma.md](agents/magma.md)                     | Magma does not do what you need: workarounds, open issues, how to report       |
| [agents/patterns.md](agents/patterns.md)               | You work on Patterns or Building blocks                                        |
| [plan/CONTENT_STRUCTURE.md](plan/CONTENT_STRUCTURE.md) | You change the sections or the layout                                          |
| [plan/DIRECTION.md](plan/DIRECTION.md)                 | You need the reasons behind Magma's choices (tokens, patterns, lint)           |
| [plan/BACKLOG.md](plan/BACKLOG.md)                     | You look for what to do next                                                   |

## User interface: Magma

The site is built with Magma's custom elements (`@maggioli-design-system/magma`, no framework
wrapper). Before writing UI code, read
`node_modules/@maggioli-design-system/magma/AGENTS.md`, section "Using the components", and only
the files it points to that you need:

- choose components from `agents/components.md`, the catalogue;
- for each component you use, read its `AGENTS.md` and the two usage files beside it,
  `examples.md` and `mistakes.md` (`pattern.md` and `antipattern.md` before
  [magma#1169](https://github.com/magma-design-system/magma/issues/1169)), in
  `dist/collection/components/<tag>/`;
- color, type and spacing come from Magma's tokens and utilities (`agents/color.md`,
  `agents/typography.md`), never from literal values.

Never guess a prop, a value or an event: the guides describe the installed version.
`dist/documentation.json` holds the same API as data; the component pages are built from it.
