# Working with Magma

The site is Magma's first consumer that installs it from npm like everyone else. When it cannot
do something with the packages, the problem is reported to Magma; the site works around it only
until Magma ships the fix.

## Reporting

- Magma's issues: https://github.com/magma-design-system/magma/issues. Search first, also the
  umbrella issues that collected many small problems of one kind, all closed by 2.4.0:
  magma#820 (keyboard), #821 (roles, names, announcements, reduced motion), #823 (events), #824
  (CSS custom properties), #829 (JSDoc), #830 (small behaviour bugs). A problem of the same kind
  found later goes into a new issue that links its umbrella.
- Labels: the kind (`bug`, `feature`, `docs`), the Magma project (`prg-stencil`, `prg-styles`,
  `prg-identity`, ...) and the origin, `prd-docs`, on every issue that comes from this site.
- Write the issue with a minimal repro and the installed version. Agents draft it and ask the
  person they work with before filing.
- Packaging gaps (something the packages should ship) are also tracked in
  [docs#1](https://github.com/magma-design-system/docs/issues/1).

## Workarounds in the code

Each one cites its issue next to the code. Remove it when the release that fixes it is adopted.

| Issue                                                                  | Where                                       | What the site does                                                                                                                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [magma#527](https://github.com/magma-design-system/magma/issues/527)   | `src/components/frame/PageFrame.astro`      | Empties the copies of the kept columns before the router swaps them, or `mds-dropdown` throws (`mds-tooltip` no longer does since 2.4.0)                                         |
| [magma#1065](https://github.com/magma-design-system/magma/issues/1065) | `src/scripts/magma.ts`                      | A sheet with `svg { transform-style: flat }` in the shadow root of every `mds-emoji`: with `preserve-3d` on that `svg`, Firefox draws nothing                                    |
| not filed                                                              | `src/components/DownloadCard.astro`         | Placement and click handling of the `mds-button-dropdown` menus (see below)                                                                                                      |
| not filed                                                              | `src/components/home/ComponentLayers.astro` | `gap-0` on the `mds-input-switch` named only for screen readers: the host keeps its gap before a label nobody sees (see below)                                                   |
| not filed, listed in docs#1                                            | `src/styles/magma.css`                      | Paragraph measure back to 75ch (`base.css` caps `p` at 30ch); title font on `h1`-`h6`; `mds-icon` filled with `currentColor`; `mds-header-bar` margins against Starlight's reset |

## Open Magma issues that concern the site

As of Magma 2.5.0: #527 (still in `mds-dropdown`: its `disconnectedCallback` calls the floating
controller that only `componentDidLoad` creates), #1065 (`mds-emoji` is invisible in Firefox:
`transform-style: preserve-3d` on the `svg` of its shadow root), and the epic #693 (theme
studio, for the Themes and preferences page).

Closed by 2.4.0 and 2.5.0, adopted together: #790, #820, #821, #823, #824, #829, #830, #944,
#951 (`mds-toast-region`), #952 (the hide button of `mds-toast`), #955, #956, #957 (`@example`
on the props that take a format: the preview placeholders), #960, #981 (`CHANGELOG.md` in
`exports`: the Changelog page can be built), #983, #984, #1037 (`mds-entity` has 2px between
the name and the detail, and an `infos` part), #1040.

## Seen, not filed yet

Noted while building the site, on the versions given. Check them on the installed version and
against open issues before filing.

- `mds-button-dropdown` gives its `mds-dropdown` no placement and no prop to choose one: the
  menu opens centred below the button (since 2.4.0 it keeps the placement while it has room,
  no longer beside the button). `mds-dropdown` checks clicks with `contains()`, which misses
  slotted content: a click in the menu closes it, Escape drops the focus (2.2.0, still in
  2.5.0).
- `mds-toast` reads its text once at load: text set later never shows (2.2.0, still in 2.5.0).
- `mds-input`: the required tip stays green after the value is cleared from JavaScript (near
  #786); the email validator returns a hard-coded Italian message; `mds-input-field` overwrites
  the `message` and `variant` set by the application on `mdsInputValidation`, and marks every
  valid field as success (2.3.0, still in 2.5.0).
- `mds-input` disabled, then enabled again (`disabled = false`, the attribute removed too),
  keeps its "disabled" tip above the field (2.3.0, still in 2.5.0; `mds-input-select` did it in
  2.3.0). The Playground disables its fields until the preview is ready, so they can read
  "Disabled" once they work.
- `mds-input-switch` names its input "Select <label>" while unchecked and "Deselect <label>"
  while checked (`aria-label`, localized), on every type: the name of a switch changes with its
  state, and adds a verb to what `role="switch"` and the checked state already say. The label
  is read once from `host.textContent` at load, so a later text never reaches the name. A
  switch can only be named by its slot: with a visually hidden slot (`sr-only`) the host keeps
  its 8px gap before the label, and an `aria-label` on the host is not passed on (2.3.0, still
  in 2.5.0).
- `mds-breadcrumb` has no links; Magma has no description list, no ordered list and no code
  block component.
- `mds-button[href]` has no `download`, nor has `mds-link` (2.5.0): the Figma files of
  `FigmaDownloads.astro` stay native `<a download>`.
- `mds-link` takes text only in its slot (2.5.0, by design): a link around inline code goes
  inside the code instead ([writing.md](writing.md), "Links").
- `--mds-elevation-*` and `--depth` break the naming convention (`--magma-*` for globals) and
  come from `styles/dist/css/theme.css`, which is not in the documented import order (2.2.0,
  still in styles 17.3.0).
- styles 17.3.0: the width utilities with a size name (`w-xs`, `min-w-xs`, `max-w-xs`,
  `basis-xs`, `xs` to `4xl`) read the container, but the logical ones (`inline-xs`,
  `min-inline-xs`, `max-inline-xs`) still read the spacing of the same name.
- Data: the DTCG globals of `styles` have no `$description`; `identity.json` has no
  descriptions or usage rules (#901 was closed with names and variants); the Figma color export
  has only the neutral tone (2.3.0).
- `mds-icon` fills with the inherited `fill`, not `currentColor`: documented, so a feature
  request rather than a bug (2.1.0, still in 2.5.0).
- `mds-emoji`: its methods report no state and fire no event, so a page that must not cut an
  expression short keeps its promises (2.3.0, still in 2.5.0).
