---
title: Informazioni sul sito
description: Come è costruita questa documentazione e a cosa serve.
---

Questo sito documenta Magma, il Design System del Gruppo Maggioli, **come lo vede chi lo
usa**: ogni pagina è generata in fase di build dai pacchetti npm pubblicati e installati in
`node_modules`, mai dal monorepo di Magma.

Per questo il sito è anche un test del packaging di Magma, oltre che la sua
documentazione. Quando nei pacchetti manca qualcosa che serve a chi li usa, è un bug di
packaging, tracciato in
[magma-design-system/docs#1](https://github.com/magma-design-system/docs/issues/1).

## Fonti

| Contenuto | Pacchetto | File |
| --------- | --------- | ---- |
| Componenti | `@maggioli-design-system/magma` | `dist/documentation.json` |
| Design token | `@maggioli-design-system/design-tokens`, `@maggioli-design-system/styles` | `dist/` |
| Icone | `@maggioli-design-system/svg-icons`, `@maggioli-design-system/icons` | `dist/svg`, `dist/dictionary.json` |

## Lingue

L'inglese è la lingua predefinita, l'italiano la seconda. I testi generati dai pacchetti
Magma sono solo in inglese finché Magma non pubblica le traduzioni. Le pagine non ancora
tradotte mostrano la versione inglese con un avviso.
