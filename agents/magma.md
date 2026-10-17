# Working with Magma

The site is Magma's first consumer that installs it from npm like everyone else. When it cannot
do something with the packages, the problem is reported to Magma; the site works around it only
until Magma ships the fix.

## Reporting

- Magma's issues: https://github.com/magma-design-system/magma/issues. Search first, also the
  umbrella issues that collect many small problems of one kind: magma#820 (keyboard), #821
  (roles, names, announcements, reduced motion), #823 (events), #824 (CSS custom properties),
  #829 (JSDoc), #830 (small behaviour bugs). A comment there is often better than a new issue.
- Labels: the kind (`bug`, `feature`, `docs`), the Magma project (`prg-stencil`, `prg-styles`,
  `prg-identity`, ...) and the origin, `prd-docs`, on every issue that comes from this site.
- Write the issue with a minimal repro and the installed version. Agents draft it and ask the
  person they work with before filing.
- Packaging gaps (something the packages should ship) are also tracked in
  [docs#1](https://github.com/magma-design-system/docs/issues/1).

## Workarounds in the code

Each one cites its issue next to the code. Remove it when the release that fixes it is adopted.

| Issue                                                                | Where                                               | What the site does                                                                                                                                                               |
| -------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [magma#527](https://github.com/magma-design-system/magma/issues/527) | `src/components/frame/PageFrame.astro`              | Empties the copies of the kept columns before the router swaps them, or `mds-tooltip` / `mds-dropdown` throw                                                                     |
| [magma#944](https://github.com/magma-design-system/magma/issues/944) | `src/components/home/AgentNames.astro`              | `bg-surface-overlay` on `mds-chip`, whose default ground is grey                                                                                                                 |
| [magma#955](https://github.com/magma-design-system/magma/issues/955) | `src/styles/magma.css`                              | Neutral `mds-banner` on `surface-overlay` instead of the card's color                                                                                                            |
| not filed                                                            | `src/components/IdentityFamily.astro`               | Placement and click handling of the `mds-button-dropdown` menus (see below)                                                                                                      |
| not filed, listed in docs#1                                          | `src/styles/magma.css`                              | Paragraph measure back to 75ch (`base.css` caps `p` at 30ch); title font on `h1`-`h6`; `mds-icon` filled with `currentColor`; `mds-header-bar` margins against Starlight's reset |
| #820, #821, #823, #951, #952                                         | `src/patterns/` (pattern code, the feedback sketch) | Keyboard and roles for `mds-file`, `sr-only` live regions for toasts, a hand-made toast stack and close button                                                                   |

## Open Magma issues that concern the site

As of Magma 2.3.0: #527, #790 (shadow ink flips to white in dark mode), #820, #821, #823, #824,
#829, #830, #944, #951 (toasts overlap), #952 (toast close control), #955, #956 (`mds-avatar`
keeps its fallback glyph after a failed `src`: the component preview hits it with the example's
broken image), #957 (`@example` on props that take a format: the preview placeholders appear
when it ships), and the epic #693 (theme studio, for the Themes and preferences page).

## Seen, not filed yet

Noted while building the site, on the versions given. Check them on the installed version and
against open issues before filing.

- `mds-button-dropdown` passes no placement to its `mds-dropdown`, which opens beside the
  button; `mds-dropdown` checks clicks with `contains()`, which misses slotted content: a click
  in the menu closes it, Escape drops the focus (2.2.0, still in 2.3.0).
- `mds-toast` reads its text once at load: text set later never shows (2.2.0, after #688).
- `mds-input`: the required tip stays green after the value is cleared from JavaScript (near
  #786); the email validator returns a hard-coded Italian message; `mds-input-field` overwrites
  the `message` and `variant` set by the application on `mdsInputValidation`, and marks every
  valid field as success (2.3.0).
- `mds-breadcrumb` has no links; Magma has no description list, no ordered list, no link and
  no code block component.
- `mds-button[href]` has no `download`.
- `mds-help`: its icon is not reachable from the keyboard (may belong in #820).
- `--mds-elevation-*` and `--depth` break the naming convention (`--magma-*` for globals) and
  come from `styles/dist/css/theme.css`, which is not in the documented import order (2.2.0).
- Data: the DTCG globals of `styles` have no `$description`; `identity.json` has no
  descriptions or usage rules (#901 was closed with names and variants); the Figma color export
  has only the neutral tone (2.3.0).
- `mds-pref-mode` disables itself and forces light mode on Safari, a Magma 1 leftover (2.1.0).
- `mds-icon` fills with the inherited `fill`, not `currentColor` (2.1.0).
