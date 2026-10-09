---
title: About this site
description: How this documentation is built and what it is for.
---

This site documents Magma, the Maggioli Group Design System, as a **consumer sees it**:
every page is generated at build time from the published npm packages installed in
`node_modules`, never from the Magma monorepo.

That makes the site a test of Magma's packaging as well as its documentation. When
something a consumer needs is missing from the packages, it is a packaging bug, tracked in
[magma-design-system/docs#1](https://github.com/magma-design-system/docs/issues/1).

## Sources

| Content | Package | File |
| ------- | ------- | ---- |
| Components | `@maggioli-design-system/magma` | `dist/documentation.json` |
| Design tokens | `@maggioli-design-system/design-tokens`, `@maggioli-design-system/styles` | `dist/` |
| Icons | `@maggioli-design-system/svg-icons`, `@maggioli-design-system/icons` | `dist/svg`, `dist/dictionary.json` |
