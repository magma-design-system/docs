# Architecture

How the site is built, area by area, and where each area takes its data from. The source files
explain themselves in their header comments: this file tells you which one to open.

## Stack

- **Astro 7 + Starlight**, versions pinned exactly in `package.json` (Renovate proposes the
  updates as pull requests). Starlight is the engine (routing, content collections, i18n,
  Pagefind search); its frame is replaced (below).
- **Markdown through Satteri** (`@astrojs/markdown-satteri`, Astro 7's processor). Plugins are
  hast plugins pushed by the integration into `config.markdown.processor.options.hastPlugins`:
  `markdown.rehypePlugins` is rejected without `@astrojs/markdown-remark`.
- **Tailwind v4** through `@tailwindcss/vite`, with Magma's theme ([styling.md](styling.md)).
- **Static output** on GitHub Pages, under the base `/docs`. No server code: endpoints in
  `src/pages/` are rendered at build time.

## Magma on the page

Loaded the way a consumer loads it, never from the monorepo:

- [`src/styles/magma.css`](../src/styles/magma.css): normalize, fonts and Magma's CSS in the
  cascade layer order of Magma's install guide (`magma/agents/assets.md`), Starlight's layer
  between Magma's base and the site's components, then Tailwind's utilities.
- [`src/scripts/magma.ts`](../src/scripts/magma.ts): the lazy loader, the icon path
  (`IconsSetService`), Starlight's `data-theme` kept on the mode chosen with `mds-pref-mode`.
- [`src/integrations/magma.mjs`](../src/integrations/magma.mjs): adds that script to every page,
  dumps every icon of the iconsauce plugins into `public/svg/` (gitignored; a stamp file skips
  the copy when the icon sets did not change), and registers the Markdown plugins.
- [`iconsauce.config.mjs`](../iconsauce.config.mjs): the icon sets (`mi/`, `mdi/`, `mgg/`, and
  `lobe/` for AI brand logos from a local plugin, `src/lib/iconsauce-lobe-icons.mjs`).
  iconsauce is how Magma and this site manage icons; for consumers it is optional, and the site
  never says otherwise.

## Frame

Starlight's components listed in `astro.config.mjs` are replaced by
[`src/components/frame/`](../src/components/frame/), built with Magma components and Tailwind:

- `PageFrame`: the grid. Desktop: the rail on the page background, then a card with the section
  navigation, the content and the right column; `SiteFooter` under the card on every page.
  Below 64rem: the mobile header (`Header`) with everything in its menu; the right column stays
  down to 48rem.
- `Rail`: brand, search field (`SearchField`, a button that opens Pagefind), the sections
  (`SectionLinks`), repository and Storybook links, and a Preferences button that opens
  `mds-pref` (mode, language, theme: `Preferences`) in an `mds-dropdown`. Collapsible to icons
  with tooltips; the state is in `localStorage` (`magma-docs:rail`).
- `Sidebar` / `SectionNav` / `SectionEntries`: the section navigation, from Starlight's sidebar.
- `TwoColumnContent` / `PageSidebar` / `TableOfContents` / `DocsNav`: the right column, a table
  of contents with a reading indicator, or the sub-pages of a component, an icon set or a brand
  group (`DocsNav`).
- `PageTitle`, `Hero` (the home page's splash), `Footer` (page footer: last modified and created
  by, from `git log --follow` of the source file in `src/lib/history.ts`, names and roles from
  `src/content/authors.json`), `ThemeProvider` (mode and theme before the first paint).

**Page changes** use Astro's ClientRouter (added in `Head.astro`). The rail, the section column
and the right column are `transition:persist`: they stay mounted while their links are the same,
and keep their scroll. `PageFrame`'s script carries the attributes of `<html>` over (mode,
theme, rail state), and hands `mds-button[href]` navigation to the router through Magma's
`NavigationService.setHandler`. Changing language is a full page load.

## Sections

The ten rail sections are defined once in [`src/lib/nav.mjs`](../src/lib/nav.mjs): id, icon,
sidebar items. The structure and its reasons are in
[plan/CONTENT_STRUCTURE.md](../plan/CONTENT_STRUCTURE.md).

| Section         | Pages and data                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home            | `index.mdx` (`template: splash`, `hero`), bands in `src/components/home/`. Counts (components, tokens, icons) are computed from the packages.                                                                                                                                                                                                                                                 |
| Foundation      | Written here (MDX). Do and don't blocks are Magma's `mds-usage` (`Usages.astro`); `FontFamilies.astro` reads weights from the tokens.                                                                                                                                                                                                                                                         |
| Tokens          | `src/lib/tokens.mjs`: the DTCG files of `design-tokens` and `styles` (`dist/dtcg/`, resolved per mode, theme and contrast) joined to `styles/dist/tailwind/consumption.json` for the Tailwind column. Components `TokenTable`, `ColorRamps`, `ColorRoleMatrix`, `TypeScale`, `TailwindMap`, ... Figma files served by `src/pages/downloads/[file].ts`.                                        |
| Icons           | `src/lib/icons.mjs` (Material Icons categories from `@material-icons/svg`, MDI tags from `@mdi/svg`, Maggioli icons without categories until `svg-icons` ships metadata: draft in `plan/svg-icons-meta.draft.json`). Generated pages `src/pages/[...locale]/icons/[set]/[...category].astro`, set data at `/icons/<set>.json`, tiles in `IconTiles.astro`. Legacy names: `LegacyIcons.astro`. |
| Components      | Collection from `magma/dist/documentation.json` (`src/loaders/components.ts`). Pages `src/pages/[...locale]/components/[tag]/[...page].astro`: main page (preview + description), then API, CSS, Pattern, Antipattern when there is data (`src/lib/components.ts`). The usage files are the prose; the readme is not shown.                                                                   |
| Building blocks | Landing page only, under construction (`soon`).                                                                                                                                                                                                                                                                                                                                               |
| Patterns        | Landing page under construction; pattern pages are drafts. Code in `src/patterns/<id>/`, read by `src/lib/patterns.ts`. See [patterns.md](patterns.md).                                                                                                                                                                                                                                       |
| Brand assets    | `src/lib/identity.mjs` reads `identity/dist/identity.json` (names, owners, variants). Generated pages `src/pages/[...locale]/brand/[group]/[...owner].astro`, files served by `src/pages/downloads/identity/[...path].ts`, cards in `IdentityFamily.astro`.                                                                                                                                   |
| Development     | Installation (`FrameworkTabs.astro`, choice kept in `magma-docs:framework`; `MagmaVersions.astro`), Agentic development, Versions and migrations.                                                                                                                                                                                                                                             |
| Community       | Channels (`Channel.astro`), Contributing, Code of conduct, About.                                                                                                                                                                                                                                                                                                                             |

## Component preview

`Playground.astro`, on every component's main page and on pattern pages:

- the stage is an iframe of [`src/pages/example/[tag].astro`](../src/pages/example/[tag].astro)
  (`/docs/example/<tag>/`): the first `html` block of the component's Pattern usage, alone on a
  page with Magma loaded. Patterns use `/docs/example/pattern/<id>/` (`example.html`).
- the controls are Magma inputs built from the props in `documentation.json`
  (`src/lib/controls.ts`); they set the props on the element in the iframe (same origin) and a
  `MutationObserver` reads changes back.
- the iframe mirrors `data-theme-name` and `data-magma-pref` from the page: without
  `data-magma-pref`, Magma follows the system's mode instead of the site's.
- the stage can be narrowed with a handle (`role="separator"`, mouse and keys); Reset reloads it.

## Other routes

- `src/pages/favicons/[file].ts`: every favicon and the web manifest, generated with `sharp`
  from the Magma logo of `identity`.
- `src/pages/lab/[name].astro`: pages to check a detail by eye (heading anchors). Dev only: a
  build has none.
- `src/pages/downloads/`: files of the packages served for download (Figma tokens, brand
  assets).

## Browser storage keys

The site's: `magma-docs:rail`, `magma-docs:framework`, `magma-docs:icon-style`,
`magma-docs:icon-format:iconsauce` and `magma-docs:icon-format:icons`. Magma's:
`mdsPrefMode`, `mdsPrefTheme`, `mdsPrefLanguage`.
