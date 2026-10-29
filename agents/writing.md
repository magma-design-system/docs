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
- **Your first page**: add yourself to `src/content/authors.json`, keyed by your GitHub login,
  with your name, your role and the emails of your commits (`git config user.email`):
  `"login": { "name": "...", "role": "...", "emails": ["..."] }`. Commits with GitHub's
  noreply email need no `emails`: the login is in it. The check "Page authors" of your pull
  request flags a page author missing from the file (`npm run check:authors` locally); it
  does not block the merge ([workflow.md](workflow.md)).
- **Editing on GitHub** (the edit button in the page footer): if you are not in
  `authors.json` yet, the check "Page authors" of the pull request turns red and its summary
  shows the entry to add. Add it, with your role, in the same pull request if you can;
  otherwise the pull request is merged anyway and a maintainer adds you. Until the next
  publication after that, the page shows your git name without a role.
- **Text by someone who does not commit** (sent by email, written in a meeting): commit it
  with them as author, `git commit --author="Name <login@users.noreply.github.com>"` with
  their GitHub login: the footer maps that email to the login.
- **Text written together**: you are the author, the others go in `Co-authored-by: Name
<email>` trailers at the end of the commit message. History keeps them; the footer does
  not show co-authors yet.
- **Someone without a GitHub account**: any key in `authors.json` (letters, digits, hyphens)
  with their email in `emails`, and commit their text with `--author="Name <email>"`.
- The footer counts editorial commits only: a commit of type `style`, `build`, `chore`,
  `refactor` or `ci` does not make you the author of a page, nor does a rename alone. Type
  a commit that changes what a page says `docs`, `feat` or `fix` (or leave GitHub's
  "Update ..." subject).

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
when they hold code, links or bold; links are `mds-link`.

- **Markdown** is converted by [`src/lib/markdown-text.mjs`](../src/lib/markdown-text.mjs) and
  [`src/lib/markdown-tables.mjs`](../src/lib/markdown-tables.mjs): write plain Markdown.
- **By hand** in `.astro`: use the same classes and props, exported by `markdown-text.mjs`
  (`TEXT`, `KIND`, `READING`), `Heading.astro` for a section heading (the reading bar names it
  and copies its link), `Code.astro` for inline code, `UiText.astro` for a UI string with code
  in it.
- Magma has no component for `strong` / `em`, numbered lists, code blocks, block quotes or
  description lists: these stay native (code blocks are Starlight's). Do not imitate a
  component with another one; note the gap instead ([magma.md](magma.md)).

### Links

A link in running text (a paragraph, a list item, a table cell) is `mds-link`, with its text
in the default slot: `<mds-link href="...">text</mds-link>`. Markdown links become one for
you.

- **Around inline code** (``[`mds-text`](...)``, most links of the component docs): the
  slot of `mds-link` takes text only, so the link goes inside the code, not around it. Markdown
  does it for you; by hand, `<Code><mds-link href="...">mds-text</mds-link></Code>`. The code
  keeps its look and its font, the link its color, underline and focus.
- **Navigation is not running text**: the rail, the section navigation, the right column, the
  page cards and the lists of the site footer keep `mds-button` or their own links. `mds-link`
  is a word of a sentence.
- **Same tab**: Markdown links open in the same tab, external ones too, as they did as `<a>`.
  With `target="blank"` the component adds the "opens in a new tab" notice itself: never write
  it in the text.
- **Downloads** stay a native `<a download>`: `mds-link` has no `download`
  ([magma.md](magma.md)).
- Plain clicks go through Astro's router (`NavigationService`, in `PageFrame.astro`); a click
  with a modifier, or the middle button, stays with the browser and opens a new tab.

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
- The rail lists the sections in three groups (`group` in `nav.mjs`, labels
  `frame.sections.<group>`): Guidelines (Foundation, Building blocks, Patterns), Development
  (Development, Agentic development), Library (Components, Tokens, Icons, Brand assets).
  Community stands alone, at the end; Home has no item (`rail: false`), the brand above links to
  it. A new section joins a group, next to the sections of that group: a group split in two
  would show its label twice. The collapsed rail shows a separator in place of each label.
- A section whose name repeats the label of its group gets a short name for the rail and the
  menu (`railLabel` in `nav.mjs`): under Development, Code and Agentic. The tooltips of the
  collapsed rail, which has no labels, and the section navigation keep the full name.
- In the open rail and in the menu the icon belongs to the group (`RAIL_GROUP_ICONS` in
  `nav.mjs`), not to its sections; the icon of a section shows only in the collapsed rail. A new
  group needs its icon there.
- The landing page of a section is labelled "Overview" / "Panoramica" (`nav.overview`) when its
  title repeats the section's name. Sections whose landing page has its own title keep it
  (Community: "Channels").
- After the landing page, every page of a section belongs to a group, and the landing page has a
  section of the same name (page cards or a table). Two exceptions: Home, whose landing page is
  the splash, and Components, grouped by the `@category` of each component in
  `documentation.json` (`COMPONENT_CATEGORIES` in `nav.mjs`). The parts of a compound
  (`@parent`) are left out of the navigation and listed in the right column of their
  component's pages (`DocsNav.astro`); a part's page highlights its component. The
  categories ship since Magma 2.6.0; a component with a category missing from
  `COMPONENT_CATEGORIES` and no parent turns the navigation back into one flat list.
- Every group of a section has an icon, drawn above its label in the section navigation:
  `GROUP_ICONS` in `nav.mjs`, keyed by the UI string of the label. Starlight's schema of a group
  is strict, and `items()` cannot run in the built pages (it reads the dictionaries from `src/`).
- Edits to `nav.mjs` need a dev server restart.
- The section navigation shows the labels as written (`--mds-button-label-transform: none`
  in `SectionEntries.astro`): `mds-button` uppercases the first letter of its label, which
  turned the iOS page into "IOS". Write titles in sentence case.

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
