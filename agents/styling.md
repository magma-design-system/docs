# Styling

Everything the site adds is styled with Tailwind utilities and Magma's tokens, as a team using
Magma would do it. Read Magma's own guides first (`agents/color.md`, `agents/typography.md` in
the `magma` package); this file covers what is specific to the site.

## Setup

- [`src/styles/magma.css`](../src/styles/magma.css) declares the layer order of the whole site:
  `reset, vendor, theme, base, starlight, components, utilities, overrides`. Tailwind v4 brings
  its theme and utilities, without preflight; Magma's Tailwind theme, typography and utilities
  come from `styles/dist/tailwind/`.
- No `<style>` in components. `magma.css` only holds rules for markup the site does not write
  itself (`<body>`, Markdown content, Starlight's elements), in `@layer components`, so a
  utility class always wins over them.
- Hooks for scripts are `data-*` attributes, never classes.
- Variants: `dark` (follows Magma's `pref-mode-*` classes, not the system), `rail-collapsed`,
  and Magma's breakpoints `tablet` (48rem) and `desktop` (64rem).
- Site tokens and utilities, in `magma.css`: `--frame-header-height` and `--frame-sticky-top`
  (top offset of sticky elements at each breakpoint), `shadow-sticky` (a sticky bar while it is
  stuck, `data-stuck`), `anchor-line` (heading anchors), `float-wave` (home statistics).
- Motion: anything that moves stops with `.pref-animation-reduce`, and with the system's
  reduced motion under `.pref-animation-system`, as Magma's components do (see `float-wave`).

## Traps

| Symptom                                                    | Cause and fix                                                                                                                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `w-72` is about 3px                                        | Magma's `--spacing` is `0.0025rem`: numbers are Magma steps (`gap-400` = 1rem). Use the steps, container sizes (`w-2xs` = 240px) or `--spacing(n)`.                    |
| `max-w-3xl` is 64px                                        | Size names resolve to Magma's spacing (`--spacing-3xl`) first. Use `max-w-(--container-3xl)`.                                                                          |
| `max-w-none` is 0                                          | Magma defines `--spacing-none: 0px`. Use `max-w-[none]`.                                                                                                               |
| `invisible` does nothing on a Magma component              | Stencil's unlayered `[hydrated] { visibility: inherit }` beats any layer. Use `hidden`, or an inline style.                                                            |
| A component has a gap above it inside page content         | Starlight's content styles put a margin between siblings (`* + *`). Use `not-content` on the site's own blocks, or `mt-0` / `my-0`.                                    |
| Text wraps in a table cell despite `whitespace-nowrap`     | Magma's reset gives `p` `text-wrap: pretty` and a max width, and `mds-text` hosts set it too: put `whitespace-nowrap` on the `mds-text` itself.                        |
| Text in an `mds-entity` stays on one line with an ellipsis | `mds-entity` truncates everything in its slots (`::slotted(*)`, `white-space: nowrap`). A page class beats `::slotted`: `whitespace-normal` on the slotted `mds-text`. |
| A label color looks wrong in dark mode                     | Magma inverts the label palette in dark mode itself: remove your `dark:` variant.                                                                                      |
| An `mds-card` is 0px wide                                  | It is a size container (`container-type: inline-size`): shrink-to-fit sizing (absolute position, `w-max`) gives it no width. Give it one.                              |
| An `mds-card` keeps its default ground                     | Its parts paint `--mds-card-background` (undocumented): set it next to the class, `[--mds-card-background:rgb(var(--magma-surface-overlay))]`.                         |
| A dropdown or tooltip of the rail hides behind the card    | A sticky element is a stacking context: the rail sits on Magma's header layer (`desktop:z-(--magma-header-z-index)`). Keep it when you touch the frame.                |
| A sticky element jumps when it sticks                      | Use `top-(--frame-sticky-top)`, which knows the mobile header and the card border.                                                                                     |
| `h1`-`h6` in Roboto                                        | Magma's `base.css` sets no font on headings; `magma.css` maps the title tokens to them. Headings written by the site are `mds-text` anyway.                            |

## Colors and surfaces

- Semantic tokens and their utilities (`bg-surface-*`, `text-fg-*`, `border-*`, `--magma-*`),
  never palette steps for interface roles and never literal values.
- The label palette (`bg-label-<color>-10`, `text-label-<color>-03`, ...) is for categories,
  such as the type tints of the API tables.
- The site's default ground for cards, chips and neutral banners is `surface-overlay`. Magma
  draws some of them on other grounds (magma#944, magma#955): see [magma.md](magma.md).
