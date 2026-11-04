# Patterns and building blocks

The two sections before Components: the rail goes Building blocks, Patterns, Components. Why
they exist and what they will hold: [plan/DIRECTION.md](../plan/DIRECTION.md) ("Patterns
section", "Building blocks section").

- A **component** is one Magma element: it is imported ready to use.
- A **building block** is a section of a page that comes back in the same arrangement (page
  header, filter bar, results summary, form section, action bar): structure and layout, no
  data, no business logic, no behavior of its own. A section becomes a block when it comes back
  in two or three patterns; blocks are not designed in advance.
- A **pattern** is the solution to a task that people carry out again and again (confirm an
  action, search a list, fill in a form). Its heart is behavior over time (what follows an
  action, state, loading, errors, focus), with the structure it needs: components and blocks.
  It can be as small as a button that opens a dialog or as large as a whole page. It is applied,
  following its guide, not imported.

Decided on 2026-10-24: blocks are about space, patterns about time. Before, a pattern was "a
whole screen or task", and the confirmation dialog and the empty and error states were listed
as blocks: they are patterns, since their parts come from a component (`mds-modal`,
`mds-zero`) and what matters is when they appear and what follows. The definition follows the
common root of the term: a pattern is named by the recurring problem it solves, not by its
size.

Decided on 2026-10-27: the word stays with this level. The usage files of one component,
which were Pattern and Antipattern, are Examples and Mistakes since
[magma#1169](https://github.com/magma-design-system/magma/issues/1169), and so are the
sub-pages of each component on the site (`/examples/`, `/mistakes/`; the old addresses
redirect). An anti-pattern is a wrong solution to a task (a toast over an open dialog), not
wrong markup. The group Feedback is called **Messages and states**: "feedback" reads as the
person telling the product something, while the group is the product telling the person what
happened. That other sense becomes a candidate of its own: **report a problem or give an
opinion** on a view or a feature (for AI, rating an answer).

## Where they come from

Since Magma 2.10.0 (2026-11-04) the patterns and the building blocks are Magma's, like the
domains of the design language: `agents/patterns/<id>.md` in `@maggioli-design-system/magma`,
the frontmatter the data (`kind`, `group`, `status`, variables, cases or regions, always true,
open choices, situations), the body the text, and a preview for each case, rule or situation in
`agents/patterns/previews/<id>/<preview>.html`. They are proposed and decided in the Magma
monorepo (its `docs/PATTERNS.md`, the commands `/pattern-new` and `/pattern-change`); the
agents read them with `get_pattern`. This site writes none and copies none: it builds a page
from each file. A pattern that is missing or wrong is an issue on Magma
([magma.md](magma.md)), with the product's label when a product needs it.

- **Decided** (2.10.0): the patterns of Messages and states (`message-placement`,
  `confirm-action`, `empty-state`, `loading`, `error-recovery`) and of Data (`list-with-filters`,
  `record-detail`); the blocks `app-shell`, `page-header`, `item-list`, `labels-and-values`.
- **Candidates**: needs Magma knows with no default yet (`choose-items`, `concurrent-editing`,
  `permissions`, `form-and-validation`, `consent-and-legal`, `notification-center`). Their page
  holds the need and what the agent does meanwhile.

Before the package shipped them, this site wrote them by hand: List with filters and Record
detail as draft pages with their code in HTML, React and Angular (`src/patterns/<id>/`), and in
the pull request #93 (closed without merging on 2026-11-04) a Messages sketch, a Page header
block and pages split into Guidelines, Code and Mistakes. The table "where a message goes"
decided here is Magma's `message-placement` now, and List with filters, Record detail and the
Page header are decided there too. The package ships no code in React or Angular: an agent
builds a pattern with the components of the project from the case `get_pattern` gives. Evidence from the products
(file names, screenshots, defects) stays out of this public repository, as out of Magma's.

## How the site shows them

- `loadPatterns()` (`src/lib/magma.mjs`) reads every file and its previews; the collection
  `patterns` (`src/loaders/patterns.ts`) renders each body without its `h1` and its notes for
  maintainers, cut after each section with previews: the cases after Cases, the rules after
  Always true, the situations of a block after Situations (`PREVIEWED`).
- One route for the three kinds, `src/pages/[...locale]/[section]/[id].astro`: `/foundation/<id>/`
  for a domain, `/patterns/<id>/`, `/blocks/<id>/` (`PATTERN_SECTIONS` in `src/lib/nav.mjs`).
  The page shows the whole file in English (the Italian page says so), a decided pattern or
  block opens with the card "With an AI agent" (`PatternAgent.astro`: the prompt names the id
  and asks for the values of the variables, as `get_pattern` takes them), and each preview runs
  on a `PreviewStage.astro` (`PatternPreviews.astro`), with Enlarge (`PreviewZoom.astro`: an
  `mds-url-view` in the window slot of an `mds-modal`, as wide as `wide`; made on each opening
  with the absolute address it needs, removed on closing) and Open in a new tab next to Reset.
  The header says where the page comes from, a candidate has a badge (`PageTitle.astro`).
- Each preview runs alone at `/docs/example/<domain|pattern|block>/<id>/<preview>/`
  (`src/pages/example/[kind]/[id]/[preview].astro`), as `render_preview` runs it: the words in
  Italian, an inset of 600, none for `whole-page`. Magma lays the previews out with Tailwind:
  `src/styles/magma.css` takes their folder as a `@source`.
- Its images beside it, `<preview>.light.webp` and `<preview>.dark.webp`
  (`src/pages/example/[kind]/[id]/[image].webp.ts`, `previewImageHref()` in
  `src/lib/patterns.ts`), copied as Magma ships them since 2.11.0: the stage laid out at 960 x 600
  and taken at 1.5x, 1440 x 900 pixels, 8:5 as the cards, made by the render that checks it.
- Navigation: a group per topic (`PATTERN_GROUPS`, `patternGroups()` in `src/lib/nav.mjs`),
  Navigation first as in Magma's catalogue, then Messages and states, Data, Input; in a group the
  decided ones, then the candidates, by title. A pattern is named by its title in English, as
  its page. The landing pages show the same groups as a gallery (`PatternGallery.astro`): the
  media of the card, the title, the need, the id, the badge of a candidate; `src/route-data.ts`
  adds the headings of the groups to the table of contents.
- The media of a card is the image of the first preview, two `mds-img` switched by Magma's
  `dark:` variant as `Logo.astro` does (the hidden one is lazy, so not loaded), on a transparent
  background over the neutral surface of `mds-card-media` while it loads. A candidate has no
  preview: its media is the icon of its group. Decided on 2026-11-04 against running the preview
  small in an inert frame, as the first version of #101 did: a preview in a card loaded 25 to 58
  files, 650 to 975 KB, and hydrated its components, where its WebP weighs 1 to 28 KB. The
  images were asked in [magma#1243](https://github.com/magma-design-system/magma/issues/1243)
  and ship since 2.11.0.
- The build fails, rather than leaving a page out of the navigation: a kind other than
  `foundation`, `pattern` and `block`; a group `PATTERN_GROUPS` lacks (add it, with its UI strings
  `nav.patterns.<group>` and `nav.blocks.<group>`); a domain `DOMAINS` lacks; a preview of no
  case, rule or situation; a preview without what to try or without its two images.

## Open on the site

- The drawing of components, blocks and patterns, a page on the API (`get_pattern`, the layer
  format) and a guide to design for a product: #89.
- `get_pattern` in the notes of the MCP tools (`McpTools`) and the skill `/magma:pattern-layer`
  in the Claude Code page: #89.
