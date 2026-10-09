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
