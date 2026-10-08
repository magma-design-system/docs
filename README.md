# Magma docs

Documentation site for Magma, the Maggioli Group Design System, published at
https://magma-design-system.github.io/docs/.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build),
statically, from the **published** Magma packages installed in `node_modules`.

## Rule: read Magma only from node_modules

The site never reads the Magma monorepo. Everything comes from the npm packages, exactly as
a consumer gets them. Anything the site needs and cannot find there is a Magma packaging
bug: track it in [#1](https://github.com/magma-design-system/docs/issues/1).

All Magma access goes through [`src/lib/magma.mjs`](src/lib/magma.mjs).

## Magma in the page

The site loads Magma the way a consumer does:

- [`src/styles/magma.css`](src/styles/magma.css): normalize, fonts and Magma styles in the
  cascade layer order of the Magma install guide, with Starlight's layer placed between
  Magma's base and component layers.
- [`src/scripts/magma.ts`](src/scripts/magma.ts): the lazy loader (`defineCustomElements`),
  the icon path (`IconsSetService`) and the light/dark sync with Starlight's theme picker.
- [`src/integrations/magma.mjs`](src/integrations/magma.mjs): injects that script into
  every page and runs [iconsauce](https://www.npmjs.com/package/@iconsauce/core) as Magma
  does: every icon slug (`mi/<variant>/<name>`, `mdi/<name>`, `mgg/<name>`) found in the
  sources, in the component usage examples and in the `svg-icons` list is copied to
  `public/svg/` (gitignored), where `<mds-icon name="...">` fetches it. The globs are in
  [`iconsauce.config.mjs`](iconsauce.config.mjs). In dev, a change under `src/` collects
  them again.

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

The site is served under `/docs/` (see `base` in `astro.config.mjs`).

## Test against unreleased Magma changes

Use a prerelease with a dist-tag, or pack the package in the monorepo and install the
tarball here:

```bash
npm install ../magma/projects/stencil/maggioli-design-system-magma-2.0.2.tgz
```

Never use `npm link`: symlinks hide exactly the packaging bugs this site is meant to catch.

## Deploy

`.github/workflows/deploy.yml` builds every pull request and deploys `main` to GitHub
Pages with `withastro/action`.
