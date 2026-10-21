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
  (`IconsSetService`), Starlight's `data-theme` kept on the mode chosen with `mds-pref-mode`,
  and the `mds-emoji` sheet that lets Firefox draw it (magma#1065).
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
- `PageTitle`, `Hero` (the home page's splash), `Footer` (page footer, see below),
  `ThemeProvider` (mode and theme before the first paint).

**Page changes** use Astro's ClientRouter (added in `Head.astro`). The rail, the section column
and the right column are `transition:persist`: they stay mounted while their links are the same,
and keep their scroll. `PageFrame`'s script carries the attributes of `<html>` over (mode,
theme, rail state), and hands `mds-button[href]` navigation to the router through Magma's
`NavigationService.setHandler`. Changing language is a full page load.

**Page footer** (`Footer`): who modified the page last and who created it, with the button to
edit it on GitHub. Git history is the only source (layout decision 2 in
[plan/CONTENT_STRUCTURE.md](../plan/CONTENT_STRUCTURE.md)):

- [`src/lib/history.mjs`](../src/lib/history.mjs) runs
  `git log --follow --no-merges --name-status` on the page's source file and keeps the
  editorial commits: not a bot's (author ending in `[bot]`), not of type `style`, `build`,
  `chore`, `refactor` or `ci` (with or without scope or `!`), not a rename alone (`R100`). A
  subject that is not a Conventional Commit (GitHub's "Update page.md") is editorial. The
  newest is "modified", the oldest "created". No history in a shallow clone, for an
  uncommitted file or for a page without editorial commits: no names in the footer.
- [`src/lib/authors.mjs`](../src/lib/authors.mjs) finds the author: `src/content/authors.json`
  is keyed by GitHub login (`name`, `role`, `emails`). The commit email is looked up in the
  `emails` of the entries, then a GitHub noreply email (`<id>+<login>@users.noreply.github.com`
  or `<login>@...`) gives the login by itself. Logins and emails are compared in lowercase.
- An author not found shows the git name without a role; the build does not fail on it.
  [`scripts/check-authors.mjs`](../scripts/check-authors.mjs) (`npm run check:authors`) runs
  both modules on every page of `src/content/docs/`, or with `--base <ref>` on the pages
  changed since the merge base, and fails on an author not found or on an entry without a
  name, a role or a login-like key; it prints the entries to paste. CI runs it on pull
  requests as a signal that never blocks ([workflow.md](workflow.md)).
- Content pull requests are merged with a merge commit, which keeps the author of each
  commit. A squash merge would make the pull request's author the author of every page it
  touches; `Co-authored-by` trailers stay in history, but the footer does not read them.

## Sections

The ten rail sections are defined once in [`src/lib/nav.mjs`](../src/lib/nav.mjs): id, icon,
sidebar items. The structure and its reasons are in
[plan/CONTENT_STRUCTURE.md](../plan/CONTENT_STRUCTURE.md).

| Section         | Pages and data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home            | `index.mdx` (`template: splash`, `hero`), bands in `src/components/home/`. Counts (components, tokens, icons) are computed from the packages. Two scenes of live components move with the scroll and the pointer (custom properties set by their script, still with reduced motion): `DepthScene` under the hero, four planes in parallax ordered by Magma's surface levels, out of focus by depth and in focus under the pointer (the components are `inert`, the pointer reaches the box around each); `ComponentLayers`, a card taken apart in 3D, opened and closed by a switch that follows the scroll. Mia (`Mascot`, `mds-emoji`) heads the agents band (the `before` slot of `HomeSection`) and reacts to it: it nods over the agents and on a click of a tab or of the copy button, smiles over the tabs and the button, thinks over the prompt; after each reaction it rests 10-15 s, and it does not react with reduced motion. |
| Foundation      | Written here (MDX). Do and don't blocks are Magma's `mds-usage` (`Usages.astro`); `FontFamilies.astro` reads weights from the tokens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Tokens          | `src/lib/tokens.mjs`: the DTCG files of `design-tokens` and `styles` (`dist/dtcg/`, resolved per mode, theme and contrast) joined to `styles/dist/tailwind/consumption.json` for the Tailwind column. Components `TokenTable`, `ColorRamps`, `ColorRoleMatrix`, `TypeScale`, `TailwindMap`, ... Figma files served by `src/pages/downloads/[file].ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Icons           | `src/lib/icons.mjs` (Material Icons categories from `@material-icons/svg`, MDI tags from `@mdi/svg`, Maggioli icons without categories until `svg-icons` ships metadata: draft in `plan/svg-icons-meta.draft.json`). Generated pages `src/pages/[...locale]/icons/[set]/[...category].astro`, set data at `/icons/<set>.json`, tiles in `IconTiles.astro`. Legacy names: `LegacyIcons.astro`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Components      | Collection from `magma/dist/documentation.json` (`src/loaders/components.ts`). Pages `src/pages/[...locale]/components/[tag]/[...page].astro`: main page (preview + description), then API, CSS, Pattern, Antipattern when there is data (`src/lib/components.ts`). The usage files are the prose; the readme is not shown.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Building blocks | Landing page only, under construction (`soon`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Patterns        | Landing page under construction; pattern pages are drafts. Code in `src/patterns/<id>/`, read by `src/lib/patterns.ts`. See [patterns.md](patterns.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Brand assets    | `src/lib/identity.mjs` reads `identity/dist/identity.json` (names, owners, variants). Generated pages `src/pages/[...locale]/brand/[group]/[...owner].astro`, files served by `src/pages/downloads/identity/[...path].ts`, cards in `IdentityFamily.astro`, each a `DownloadCard.astro` (shared with the Media kit).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Development     | Installation (`FrameworkTabs.astro`, choice kept in `magma-docs:framework`; `MagmaVersions.astro`), Agentic development, Versions and migrations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Community       | Channels (`Channel.astro`), Contributing, Code of conduct, About.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

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
- `src/pages/covers/icons/[file].ts`: the avatar of Magma at the sizes of the social and chat
  profiles (Covers).
- `src/pages/covers/previews/[...file].ts`: light WebP previews of the covers, for the Media kit
  (Covers).
- `src/pages/lab/[name].astro`: pages to check a detail by eye (heading anchors). Dev only: a
  build has none.
- `src/pages/downloads/`: files of the packages served for download (Figma tokens, brand
  assets).

## Covers

`public/covers/` holds the covers of the site: images that present Magma on other sites (link
previews, the social preview of the GitHub repository, posts). Astro copies `public/` as it is,
so every file keeps a stable URL, `https://magma-design-system.github.io/docs/covers/<file>`,
that other sites can point to; an image under `src/assets/` gets a hash in its name instead.

- Names: `<use>-<width>x<height>.png` (`og-1200x630.png`, `github-1280x640.png`), with the
  language when a cover has one per language (`og-it-1200x630.png`). Only the exported images.
- `og-1200x630.png` is the `og:image` of every page (`Head.astro`, alt text `frame.cover.alt`):
  Starlight sets `twitter:card` to `summary_large_image` but has no image. A page can set its
  own with `og:image` in the `head` of its frontmatter.
- Starlight writes `<title>` as `<page title> | <site title>` and `og:title` as the page title.
  The home, whose title is the site title, sets both in the `head` of its frontmatter
  (`Magma Design System | Maggioli`, `Magma Design System`) instead of `Magma | Magma`; its
  `title` stays `Magma`, the name in the hero.
- GitHub does not read a URL: the social preview of the repository is uploaded by hand
  (Settings, General, Social preview), from the file here.
- The profile pictures are generated, not kept here: `src/pages/covers/icons/[file].ts` draws
  the avatar of `identity` (`avatar/avatar-magma.svg`) at the sizes the profiles ask for
  (`AVATAR_SIZES` in `src/lib/covers.mjs`), `/covers/icons/avatar-<size>x<size>.png`. The icons
  of the site itself (iOS home screen, Android, browsers) are the favicons (Other routes).
- `screenshots/` holds full-page screenshots of the home (desktop and mobile, light and dark),
  kept as backups to build covers from. `npm run screenshots` takes them again from a production
  build served by `npm run preview -- --port 4322` (options in
  [`scripts/screenshots.mjs`](../scripts/screenshots.mjs)): reduced motion keeps the scenes
  still, the KPI figures are made static, and a mobile page taller than Chrome's largest surface
  is taken in blocks and stitched.
- The **Media kit** page (`community/media-kit.mdx`) lists them all, by group (`MediaKit.astro`,
  data in `src/lib/covers.mjs`): link previews, posts (names starting with `post-`), profile
  pictures, screenshots. Each card is a `DownloadCard.astro`, as in Brand assets: Download, and
  in its menu the file and its full URL to copy, for forms that ask for an image address. The
  previews are light WebP files generated by `src/pages/covers/previews/[...file].ts`, the top
  of a screenshot. A new cover shows up by itself; its title comes from `media.use.<use>` in the
  UI dictionaries (the name before its size), or its file name until the key is added.

## Browser storage keys

The site's: `magma-docs:rail`, `magma-docs:framework`, `magma-docs:icon-style`,
`magma-docs:icon-format:iconsauce` and `magma-docs:icon-format:icons`. Magma's:
`mdsPrefMode`, `mdsPrefTheme`, `mdsPrefLanguage`.
