# Direction

Decision record for the choices that set Magma apart from the large design systems of
2025-2026. Decided on 2026-10-15. Each choice is shown on the public site only once it is
true; until then it lives here.

## Context

The largest design systems (Atlassian, Ant Design, Spotify Encore) have moved from "a
component library with guidelines" to platform infrastructure: thousands of tokens,
governance enforced in code, documentation written as a specification for AI agents.
They optimize the speed of change across hundreds of products, not the speed of
building one. Magma serves fewer products and wants both: keep the token
infrastructure (it makes themes, dark mode and agents cheap), but hide it from the
people who only need to build an app.

Magma today (styles 17.1.0, magma 2.2.0): 1588 custom properties in
`tokens.editor.css`, about 787 component-scoped (`--mds-*`), about 200 semantic
(`--magma-*`), the rest palettes (label, tone, status, ...). 114 components. Agent
guides ship in the package (`AGENTS.md`, `agents/*.md`, per-component `AGENTS.md`,
`pattern.md`, `antipattern.md`). No lint rules for consumers.

## The choices

1. **A small contract.** The semantic `--magma-*` tokens are the stable API. Component
   tokens are split into the few promised for theming and the rest, which is
   implementation and may change in any release. To decide in Magma: where the flag
   lives (a DTCG `$extensions` entry per token, or a published list).
2. **Ordered by how often you need it.** The site leads with the common path: a
   component with its defaults (most cases), then semantic tokens through Tailwind for
   layout, and only last the theming of a component. Token pages open by saying when
   you do not need them.
3. **Patterns before more tokens.** Whole screens for the applications Maggioli builds
   (lists, details, forms, states), with code to copy in HTML, React and Angular. See
   "Patterns section" below.
4. **Governance only where it pays, and in code.** No review boards: rules that run in
   the editor, in CI and in the agent's loop. Errors for what is broken or not
   accessible; token discipline as a warning in existing products, an error in new
   ones. See "Lint rules" below.
5. **Two audiences, two channels.** People read the site; agents read the package
   (guides, `documentation.json`, lint rules). The site is not written for machines.
   Already true.

On the public site: one page explaining the choices (what many large systems do, what
Magma does, why, what it costs), linked from the home. Large systems are described as
a trend, never named.

## Lint rules

Prose rules already exist in Magma (`docs/agents/anti-patterns.md`,
`conventions.md`, `color.md`, `theming.md`). The lint makes them executable.

- **Package:** a new monorepo project, released with `magma`, with an ESLint plugin
  (templates: HTML, JSX, Angular) and a Stylelint plugin (CSS, SCSS). One rule core
  works on "an element with attributes and classes", with one adapter per parser
  (`@html-eslint/parser`, JSX, `@angular-eslint/template-parser`; Vue later).
- **Data, not hand-written lists:** the rules read `documentation.json` (props and
  allowed values, events, slots, parts) and the DTCG tokens of the installed version
  from `node_modules`, so they never drift from the components.
- **Presets:** `recommended` (broken or not accessible: errors) and `strict` (adds
  token and Tailwind discipline as errors). Existing products start from
  `recommended` with the token rules as warnings.
- **Agents:** `AGENTS.md` tells the agent to run the lint after writing; every message
  links to the rule's page on the site (Development, generated from the rules' meta).
- **First consumer:** this site, as it already is for packaging.

| Rule                       | Tool      | Catches                                             | Source               |
| -------------------------- | --------- | --------------------------------------------------- | -------------------- |
| `valid-attribute-values`   | ESLint    | `<mds-banner tone="outline">`                       | `documentation.json` |
| `no-unknown-attribute`     | ESLint    | props that do not exist                             | `documentation.json` |
| `no-false-boolean`         | ESLint    | `disabled="false"`                                  | conventions          |
| `no-nested-interactive`    | ESLint    | `<a><mds-button></mds-button></a>`                  | anti-patterns        |
| `compound-structure`       | ESLint    | child outside its parent, wrappers in between       | conventions          |
| `prefer-mds-element`       | ESLint    | `<button>`, `<input>` where an `mds-*` exists       | anti-patterns        |
| `prefer-label-prop`        | ESLint    | nested HTML in the default slot when `label` exists | conventions          |
| `prefer-mds-events`        | ESLint    | `(change)` / `onChange` on a component with `mds*`  | anti-patterns        |
| `accessible-name`          | ESLint    | icon-only buttons and images without a name         | `documentation.json` |
| `no-raw-palette-classes`   | ESLint    | `bg-white`, `text-gray-700`                         | color                |
| `no-arbitrary-values`      | ESLint    | `bg-[#fff]`, `p-[13px]`                             | tokens               |
| `no-raw-color`             | Stylelint | hex, `rgb()`, `hsl()` outside tokens                | tokens               |
| `known-tokens`             | Stylelint | `var(--magma-*)` that does not exist                | DTCG                 |
| `no-internal-tokens`       | Stylelint | component tokens outside the contract               | choice 1             |
| `no-shadow-piercing`       | Stylelint | `>>>`, `/deep/`, undocumented `::part()`            | anti-patterns        |
| `no-color-scheme-override` | Stylelint | `@media (prefers-color-scheme: dark)`               | theming              |

First release: `valid-attribute-values`, `no-false-boolean`, `accessible-name`,
`no-raw-palette-classes`, `no-raw-color`, `no-color-scheme-override`.
`no-internal-tokens` waits for choice 1.

## Patterns section

A ninth rail item, after Components. Section navigation mirrors the landing groups.

- **Overview**: what a pattern is here (a whole screen or task, not one component), how
  to read a page.
- **Page structure**: app shell (`mds-header`, `mds-header-bar`, `mds-pref`), page
  header (title, `mds-breadcrumb`, actions), navigation within a page (`mds-tab`).
- **Data**: list with filters and pagination (`mds-filter`, `mds-table`,
  `mds-paginator`), detail of a record (`mds-details`, `mds-entity`, `mds-label`,
  `mds-badge`), search, bulk actions (`mds-button-dropdown`).
- **Input**: form and validation (`mds-input-field`, `mds-input-tip`, `mds-button`
  with `await`), step-by-step procedure (`mds-stepper-bar`), file upload
  (`mds-input-upload`, `mds-file`), dates and periods (`mds-input-date`,
  `mds-input-date-range`).
- **Feedback**: empty states (`mds-zero`), loading (`mds-spinner`, `mds-progress`),
  errors (`mds-banner`), confirmations and destructive actions (`mds-modal`),
  notifications (`mds-toast`, `mds-notification`).
- **AI**: content generated by AI and its disclosure (`mds-policy-ai`, the
  `--magma-accent-ai-*` tokens).

Every pattern page has the same parts: when to use it (and when not), anatomy, live
example with code in HTML / React / Angular, components used (generated from the
example's code), behavior (responsive, keyboard, focus order, states), accessibility,
content (labels and messages, following voice and tone), common mistakes (each linked
to the lint rule that catches it).

First wave: list with filters, detail, form and validation, empty and error states.

Built (2026-10-15): the section (overview + Data group) and **list with filters**.

- Code lives in this site for now: `src/patterns/<id>/` holds `example.html` (plain
  HTML, also the live preview at `/example/pattern/<id>/`), `react.tsx` and
  `angular.ts`, read by `src/lib/patterns.ts`. The React and Angular files are left out
  of the site's type check (tsconfig.json); they were checked once with `tsc` (React
  19, strict) and `ngc` (Angular 20, `strictTemplates`). Later they can move into the
  Magma package, where agents read them and CI can compile them against each release.
- The preview reuses the component stage (`Playground.astro`, new `src`, `intro`,
  `title` props and an `actions` slot) through `PatternPreview.astro`.
- "Components" of a pattern page is generated from `example.html`: its tags and the
  components its script creates.
- **Record detail** (same day): identity, actions by status (dialog for the ones that
  need a note), tabs for data / documents / history, back link that returns to the
  list as it was. The list example now opens it from its numbers, so the two previews
  are connected.
- Magma gaps found and filed: magma#941, #942, #943 (filter, table sort). Worked around
  in the detail code: `mds-file` without role and keys (#820), `mds-toast` not announced
  (#821). Not filed yet: `mds-toast` shows its text only when it has one at load (a gap
  left by #688), the required tip of `mds-input` stays green after a value cleared from
  JavaScript (near #786), `mds-breadcrumb` has no links (the detail uses a back link),
  no description list component (the detail uses native `dl`).

Open questions:

- Naming: components already have "Pattern" and "Antipattern" sub-pages (from
  `pattern.md` / `antipattern.md`). The section is called Patterns for now; either it
  takes another name, or the sub-pages are labelled differently on the site.
- The "Mistakes to avoid" of a pattern will link to the lint rules once they exist.
