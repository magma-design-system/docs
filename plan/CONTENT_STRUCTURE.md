# Content structure

Decision record for the information architecture of the site. Source: the internal deck
"Magma Design System - Introduzione" (50 slides), reworked for a public documentation site.
Decided on 2026-10-08.

## Navigation (11 rail items)

| Rail                | Pages                                                                                                         | Source                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Introduction (home) | What Magma is, Why Magma, Adoption levels                                                                     | deck                                |
| Foundation          | Values, Design principles, Accessibility, Ecology, Content (voice and tone, grammar, naming)                  | deck + new writing                  |
| Building blocks     | Recurring sections of a page made of components (page header, filter bar, ...): structure and layout, no data | written here, see `DIRECTION.md`    |
| Patterns            | Solutions to recurring tasks (confirm an action, ...): behavior first, with code in HTML, React and Angular   | written here, see `DIRECTION.md`    |
| Development         | Install (Vanilla / React / Angular), lint, integrating existing vs new products, versioning and migrations    | deck + `AGENTS.md`                  |
| Agentic development | Start a project, working with an agent; guides in the package, MCP server, Claude Code plugin                 | `AGENTS.md`, `agents/*.md` of magma |
| Components          | One page per component                                                                                        | `magma/dist/documentation.json`     |
| Tokens              | Color, type, space, shape, motion, themes; platforms (web, Android, iOS, Flutter); tools (Tailwind, Figma)    | `design-tokens`, `styles`           |
| Icons               | Library, semantic dictionary                                                                                  | `svg-icons`, `icons`                |
| Brands / Assets     | Logos, illustrations, avatars                                                                                 | `identity`                          |
| Community           | Support, feature requests, contributions, training                                                            | deck + Magma GitHub issue templates |

Rule: Magma data (components, tokens, icons, brand assets, agent guides) comes only from
`node_modules`. Guidelines prose (principles, content design, patterns) is written here.

Order (decided 2026-10-24): after Foundation the rail goes from the sections of a page down to
the values: Building blocks, Patterns, Components, then Tokens and Icons. Building blocks are
about space (a section of a page), patterns about time (what follows an action), components are
the parts both are made of; tokens and icons come after, as DIRECTION.md orders by how often
they are needed. Building blocks and Patterns stand before Components even while they are
coming soon. Since 2026-10-28 Development and Agentic development stand between the guidelines
and the library (Groups, below).

Groups (decided 2026-10-26, revised 2026-10-28): eleven items in one column had become hard to
scan, so the rail lists them under three labels. Guidelines: Foundation, Building blocks,
Patterns, the prose written here. Development: Development and Agentic development, how a
product is built with Magma, by hand or with an agent; it comes right after the guidelines.
Library: Components, Tokens, Icons, Brand assets, the data that comes from the packages.
Community stands alone, at the end. Home has no item: the logo and the name of the site, at the
top of the rail and of the mobile header, link to it (a Home item said the same thing twice; the
Changelog, the other page of the Home section, is reached from the home page and its section
navigation). Under the Development label the two sections are named Code and Agentic (Codice,
Agentico): "Development" and "Agentic development" one under the other read alike. Their pages,
their section navigation and the tooltips of the collapsed rail keep the full names.

One design for every menu: the open rail, the section navigation and the right column are made
of the same parts (`NavList`, `NavHeading`, `NavLink` in `src/components/frame/`). A group is
its icon above its `h6` label, its links are small buttons whose labels line up with the label;
in the rail, Community is a link of its own, like the Overview of a section. The
labels of the rail sit as far from its edge as those of the section navigation from the border
of the card (32px). Icons: one per group, none on the sections. Eleven icons, one per section,
read well with five sections and had become noise. The collapsed rail, which has no labels,
keeps the icon of every section, with a separator between the groups.

Height: the groups make the rail taller. The open rail needs about 990px, the collapsed one about
940px; below that they scroll (before the groups: 780px open, 860px collapsed).

## From the deck, kept

- Foundation / Documentation / Product, with Content, Design, Development (slides 10-17).
- Values: Inclusive, Enabling, Intuitive, Flexible. Design principles: "Unified rather than
  diversified", "Iconic" (slides 13-14).
- Support / Backlog / Communication (slides 24-28), linked to the Magma issue templates:
  bug, feature, contribution proposal, documentation, training request.
- Adoption levels and asset maturity (slides 32-33), as a self-assessment checklist.
- Existing vs new product integration (slides 31, 44).
- Accessibility preferences and consumption levels (slides 45-49), with live demos of
  `mds-pref-mode`, `mds-pref-contrast`, `mds-pref-animation`, `mds-pref-consumption`.

## From the deck, corrected

- "Each component is published separately" (slide 36) is no longer true: Magma 2 ships one
  package, `@maggioli-design-system/magma`, plus the React and Angular wrappers.
- Versioning (slide 35): a major release is a breaking change, say so plainly; link the
  migration guides.
- "Magma is WCAG compliant" (slides 45-47) becomes "designed for WCAG 2.x AA", stating what
  is tested, until there is a documented audit.
- Consumption level LOW: components minimize consumption (the deck says "efficiency").

## From the deck, left out of the public site

- ROI and business outcome figures (slides 5-8): unsourced estimates for management.
- Core team response time chart and SLA data (slide 29).
- The benefits illustration (slide 4): unclear rights.
- Business areas (slides 37-39): only the technology list is reused, to drive the install
  guides. Note: Vue is listed but has no wrapper (vanilla custom elements apply).

## Languages

English is the default locale (site root), Italian is the second one (`/it/`). Spanish and
Greek can be added later: one locale entry in `astro.config.mjs` plus translations.
UI strings live in a per-locale dictionary, never hard-coded in components. Untranslated
pages fall back to English with a notice. Text generated from Magma packages is English
only until Magma publishes translations.

## Layout decisions

1. No user block in the rail: it came from the earlier Strapi plan (authenticated
   editorial editing) and has no meaning on a static site.
2. Page footer "created by / modified by": names and dates from git history, roles from a
   data file (`authors.json`, GitHub login -> name, role and commit emails). Git history is
   the only source: no authors in the frontmatter, no GitHub API at build time. Only
   editorial commits count: not a bot's, not `style`, `build`, `chore`, `refactor`, `ci`,
   not a rename alone. CI flags, on the pull request that changes a page, an author missing
   from `authors.json`, as a signal that never blocks: a maintainer adds the entry and the
   role shows up at the next publication. Content pull requests are merged with a merge
   commit, which keeps the author of each commit (decided 2026-10-20). Co-authors are not
   shown yet.
3. Component preview: inline, driven by the attributes table. Iframe only for full demos.
4. Component "Documentation" column: each entry (Anatomy, API, CSS, Features, Examples,
   Mistakes, Installation) is a sub-page of the component. What goes into Anatomy is
   still to be defined. The usage Description opens the component's main page (Overview);
   Examples and Mistakes are separate sub-pages, so the right and the wrong forms are
   never mixed (decided 2026-10-09; named Pattern and Antipattern until 2026-10-27,
   magma#1169).
5. Agentic development is a section of its own (decided 2026-10-24, at `/ai/`), after Development: with Magma 2.6.0
   the agent tooling of the epic magma#1083 (guides in the package, MCP server, Claude Code
   plugin and skills, lint) is more than one page of Development can hold. Its message is
   that the work is optimized, not only integrated with AI: the model is kept for what needs
   judgment, and what is mechanical goes to tools that answer the same way every time and cost
   no tokens. The lint keeps its page in Development, since people and CI use it too; the
   section presents it as a step of the agent's work and links it. The name says the practice,
   not the tool (first "AI agents", renamed the same day); the URL stays the short `/ai/`. The old page
   `/development/agentic-development/` redirects to `/ai/start-a-project/`.
6. The right column (table of contents, sub-pages) stands next to the content only from 1280px
   (Magma's `wide`; decided 2026-10-28). Between 1024 and 1280px, next to the rail and the
   section navigation, it left the text a narrow strip. Below 1280px it opens in a dropdown from
   the button of a reading bar (revised 2026-10-29: a button that stuck next to the title, and
   named the section once the page scrolled, covered the text below the title). The bar names
   the section being read, the heading the table of contents marks, also on the pages whose
   column lists sub-pages, and holds its anchor: a link to the heading of the section, which
   also copies its address. Headings have no anchor of their own: the bar is where the reader
   already looks to know where they are, and one anchor replaces one per heading (decided
   2026-10-29). So the bar is there at every width, from 1280px without the button of the
   column, which is in view. How far the page has been read is told once, by the table of
   contents: a progress bar under the name said it again. From 1024px the bar floats over the
   top of the content, as wide as the text, the name in `h4`; once the page scrolls it comes
   down from above the window, past its place, and settles, and it goes back up when the page is
   at the top, where the title says where the reader is (a movement, not a fade). Links to
   headings land below it. Below 1024px it is in the mobile header, between the logo and the
   menu button: there the button of the column stays, and the anchor and the name (`h5`, the
   room is short) show while the page is read, in place of the logo and the name of the site up
   to 768px (from there both fit). The list does not open by itself: over the text it would
   cover the lines being read; the bar tells where the reader is, the list is a click away. The
   same button serves phones, which had no table of contents before. The pages of the icons have
   no reading bar (decided 2026-10-29): their search sticks at the top of the content and looks
   through the whole set, and two bars stuck one over the other did not fit. On the pages of a
   set with categories (Material Icons, Material Design Icons) the column, the categories,
   stands next to the icons from 1024px: a grid of icons has no measure of text to keep, and
   without the bar the categories would have no button there.
