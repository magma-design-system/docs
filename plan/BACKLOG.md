# Backlog

Open work on the site, by section. Take an item, and move what you learn into `agents/` or
`plan/` with your pull request. Magma's own open issues are in
[agents/magma.md](../agents/magma.md).

## Home

- The page footer (modified, created, edit link) also shows on the home page: decide whether it
  belongs there.

## Foundation

- Editorial review of the texts.
- The deck's design principle "Iconic" is not covered yet.
- A page explaining Magma's choices ([DIRECTION.md](DIRECTION.md)), linked from the home, once
  they are true.

## Tokens

- Open: one sub-page per token family? All primitive palettes, or only label and brand?
- Token and group descriptions: the packages started shipping `$description` (magma#876); the
  site does not show group descriptions yet.

## Icons

- Maggioli icon categories: `plan/svg-icons-meta.draft.json` is a proposal of metadata (16
  categories, legacy aliases) to publish in `svg-icons` (`dist/meta.json`). Once it ships, the
  Maggioli set gets category pages like the other sets.

## Components

- The Anatomy sub-page: what goes into it is still to be defined. Features and Installation
  sub-pages wait for data.

## Building blocks and Patterns

See [agents/patterns.md](../agents/patterns.md): open decisions, proposed order, the Feedback
sketch to turn into a page.

## Development

- **Editor setup** page, after Installation: `tokens.editor.css` with CSS Var Complete
  (`cssvar.files`, `cssvar.ignore: []`, `cssvar.disableSort: true`; add `html` to
  `cssvar.extensions` for Angular templates and plain HTML), Tailwind IntelliSense, component
  types, the `$schema` of the design tokens, a ready `.vscode/settings.json` and
  `extensions.json`. State the limits: Tailwind class completions are always alphabetical
  (tailwindcss sorts them, no setting); tokens inside `var(--...)` keep the scale order with
  `disableSort`. Source: section 5 of `magma/agents/assets.md`. Then give this repository the
  same `.vscode/`.
- **Existing vs new products** page: needs slides 31 and 44 of the Magma introduction deck.
- Run `npm run lint` (Magma's lint on the site) in CI, next to `astro check`: today it runs
  locally only.

## AI agents

- `llms.txt` at the root of the site, generated from the navigation, links only (installation,
  the AI agents section, the packages' `AGENTS.md`): decided in the epic magma#1083, phase 6.
- Generate the tool table of the MCP server page from the package, once magma exports the tool
  definitions; it is written by hand until then.
- Try the skills of the Magma plugin on this repository (`.claude/settings.json` registers it)
  and write what they get wrong in [agents/magma.md](../agents/magma.md).

## Brand assets

- Descriptions and usage rules, when `identity.json` ships them.

## Layout

- At 1024px with the rail open the section column is narrow (about 150px): open decision.
- Hover prefetch for the links in shadow roots: Astro's ClientRouter prefetches every `<a>` of
  the document on hover (`prefetchAll`), but only finds anchors in the light DOM, so `mds-link`
  and `mds-button[href]` are not prefetched. `prefetch()` from `astro:prefetch` on the
  `pointerover` and `focusin` of those hosts would bring it back.

## Languages

- Spanish and Greek, later: one entry in `src/lib/i18n.mjs` plus the translations.

## Tracking

- [docs#1](https://github.com/magma-design-system/docs/issues/1) still lists as open many
  issues that Magma closed in 2.1.0-2.3.0: bring it up to date.
