# Writing pages

## Where pages live

- A page is `src/content/docs/<section>/<page>.md` or `.mdx`, with `title` and `description`
  in its frontmatter. Its Italian translation has the same path under `src/content/docs/it/`.
  Write both: a missing translation falls back to English with a notice, which is a fallback,
  not a plan.
- Pages generated from the packages (components, icon sets, brand groups) are routes in
  `src/pages/[...locale]/`, not content files; their intros are UI strings.
- **Renaming or moving a page** (also `.md` -> `.mdx`): commit the rename alone, with no other
  change. The page footer reads the history with `git log --follow`, which loses a file whose
  content changed together with its name.
- Your first page: add your commit email to `src/content/authors.json` (name and role), or the
  footer shows your git name without a role.

## Languages

- English is the default locale, at the root; Italian is under `/it/`. Locales are in
  `src/lib/i18n.mjs`; Spanish and Greek may come later.
- UI strings live in `src/content/i18n/en.json` and `it.json`, read with `Astro.locals.t()`.
  English holds every key (it is the schema); Italian may lack some. A key built at runtime
  needs a cast: `t(key as never)`.
- The dictionaries stay plain text. Inline code in a string is written between backticks and
  rendered by `UiText.astro`.
- Text generated from the packages (component docs, token names) is English only.
- Italian: address the reader as "tu"; inclusive language as on the site's own page
  (`foundation/inclusive-language`: no schwa, no asterisks).

## Text as Magma components

The site shows Magma, so its text is Magma: headings and paragraphs are `mds-text`, lists
`mds-list` / `mds-list-item`, rules `mds-hr`, notices `mds-banner`, tables `mds-table`, even
when they hold code, links or bold.

- **Markdown** is converted by [`src/lib/markdown-text.mjs`](../src/lib/markdown-text.mjs) and
  [`src/lib/markdown-tables.mjs`](../src/lib/markdown-tables.mjs): write plain Markdown.
- **By hand** in `.astro`: use the same classes and props, exported by `markdown-text.mjs`
  (`TEXT`, `KIND`, `READING`), `Heading.astro` for a section heading with its anchor,
  `Code.astro` for inline code, `UiText.astro` for a UI string with code in it.
- Magma has no component for links, `strong` / `em`, numbered lists, code blocks, block quotes
  or description lists: these stay native (code blocks are Starlight's). Do not imitate a
  component with another one; note the gap instead ([magma.md](magma.md)).

### Kinds of text

`KIND` in `markdown-text.mjs` sets the typography of each kind of text:

| Kind      | Where                                                              | Text                | Inline code |
| --------- | ------------------------------------------------------------------ | ------------------- | ----------- |
| `reading` | Markdown pages, paragraphs written by hand (`{...READING}`)        | `paragraph`, `read` | `snippet`   |
| `example` | Do and don't blocks (`mds-usage`)                                  | `detail`, `read`    | `hack`      |
| `table`   | Markdown tables, API descriptions (frontmatter `magmaText: table`) | `detail`, `info`    | `hack`      |

Every other piece of interface text (cards, banners, captions, tiles, tables) is `detail` with
`hack` code.

The API descriptions are JSDoc from `documentation.json`, written to be read as they are: their
HTML is shown as text (frontmatter `magmaHtmlAsText: true`), so `the name of an <input>
element` does not put a text field in the table. The usage files stay Markdown with HTML.

### Inline code

- Always `mds-text tag="code"` (`Code.astro`), without the ring and on a light background
  (`TEXT.code`). Never `mds-badge` (uppercase) or `mds-label` for code-like values.
- Inside a heading, code is plain text in the heading's font.

### Tables

- Markdown tables become `mds-table`; every cell is `whitespace-nowrap`. The table takes the
  width of its column and `mds-table` scrolls sideways. Do not add minimum or maximum widths or
  wrapping tricks.
- Prose does not fit in one-line cells: write it as a list instead of a table.
- API tables: the name column is bold code without background; types one per line, tinted by
  kind (string green, enum blue, number violet, boolean orange, `TypeValue.astro`); defaults
  plain gray code. Magma inverts the label palette in dark mode by itself: never add `dark:`
  variants to label colors.

## Navigation

- Sections and their items are in [`src/lib/nav.mjs`](../src/lib/nav.mjs). A section's
  navigation mirrors the groups of its landing page, in the same order.
- The landing page of a section is labelled "Overview" / "Panoramica" (`nav.overview`) when its
  title repeats the section's name. Sections whose landing page has its own title keep it
  (Community: "Channels").
- Edits to `nav.mjs` need a dev server restart.

## Under construction and drafts

- `soon: true` on a section in `nav.mjs`: its landing page shows the "Under construction" banner
  (`ComingSoon.astro`) and its home card a badge. Today: Building blocks and Patterns.
- `draft: true` in a page's frontmatter: in the navigation in dev, left out of a production
  build together with its preview (`published()` in `nav.mjs`).
- To publish: remove `draft` from the page, and `soon` from the section with its first page.

## Words

- Guidelines are written here in original words. The old site's Foundation texts were adapted
  from another design system and must not come back.
- Other design systems are described as a trend, never named.
- A Magma choice appears on the site only once it is true (`plan/DIRECTION.md`).
- Accessibility: "designed for WCAG 2.x AA", stating what is tested, never "compliant".
- Icons: iconsauce is how Magma works; never write that consumers must use it.
- Business figures (ROI, response times, SLA) stay off the public site.
- Voice and tone: follow the site's own Foundation pages.
