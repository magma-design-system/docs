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
  following its guide and its code in HTML, React and Angular, not imported.

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

## State

- Both sections are online only as their landing pages, under construction (`soon: true`).
- Pattern pages, drafts (`draft: true`, dev only): **Messages** (group Messages and states;
  HTML only, still a sketch), **List with filters**, **Record detail** (group Data).
- Block pages, drafts: **Page header**, the first block, taken on 2026-10-29 from the header
  that the three patterns each built in their own way. Its rules (three actions at most, the
  title always `typography="h3"`, the actions aligned to the top from `lg`) are a proposal for
  the design system team. The patterns do not use it yet (plan/BACKLOG.md).

## How a pattern is made

One topic at a time:

1. Collect the real cases from Maggioli's products: the screens, situations, data and roles
   where the need shows up. The products are a catalogue of needs, never the solution to
   document: most of their screens were not designed with the design system.
2. Check what Magma already offers: the component guides, their `examples.md`.
3. Write a proposal with its open questions; the design system team decides.
4. Build a clickable sketch in `src/patterns/<id>/example.html` and try it.
5. Write a brief, then the page.

Evidence from the products (file names, screenshots, defects) stays out of this public
repository. A brief written for this repository describes the problem and the rules only:
`plan/patterns/<id>.md`, with the sections Problem (when to use it, when not), Parts (required,
optional, order, how it adapts to the width), Always true (rules for every product: they become
checks for agents and lint), States (loading, empty, error, partial, disabled, by role),
Decisions.

## Files of a pattern

A block is made the same way, in `src/blocks/<id>/` and `src/content/docs/blocks/<id>/`; the
components below take `kind="blocks"`.

- `src/patterns/<id>/example.html`: plain HTML and a script, the demo in English. It is also
  the live preview, `/docs/example/pattern/<id>/` (`/docs/example/block/<id>/` for a block,
  `src/pages/example/[kind]/[id].astro`), built in production only for published pages.
- `react.tsx` and `angular.ts`: the same screen. They are outside the site's type check
  (`tsconfig.json`): check them in a scratch project with `tsc` (React 19, strict) and `ngc`
  (Angular 20 or later, `strictTemplates`). A sketch may have the HTML only: the Code page then
  shows it without the framework tabs. In Angular, a template reference never takes the name of
  an input (`#title` hides `title()`).
- `src/lib/patterns.ts` reads them; `PatternPreview.astro`, `PatternCode.astro` and
  `PatternComponents.astro` (the components used, read from the example) show them.
- The pages, like those of a component: `src/content/docs/patterns/<id>/` and its Italian twin,
  one file per page, listed in the "Documentation" column (`patternPages` in
  `src/lib/patterns.ts`, `DocsNav.astro`). The sub-pages keep the title of the overview as
  their `h1` (`PageTitle.astro`); their front matter title is "<name> - <page>", for the
  `<title>` and the search. Links relative to a sub-page climb one more level (`../../`).
  - `index.mdx`, the overview: `PatternAgent` (how to apply it with an AI agent, the prompt with
    the addresses of the sub-pages), the introduction, the preview, when to use it, anatomy
    (or the cases), components.
  - `guidelines.mdx`: behavior, accessibility, content.
  - `code.mdx`: what to replace, then the code.
  - `mistakes.mdx`: the do and don't blocks.
- The landing page of each section is its gallery (`PatternGallery.astro`, placed right after
  the introduction): the patterns or blocks by topic, the groups of the section navigation
  (`galleryGroups()`), each topic a heading that `src/route-data.ts` adds to the table of
  contents. One card each: the pattern running small (`MiniPreview.astro`, an inert, lazy frame
  scaled down to its box; a sketch with a demo panel shows one of its cases,
  `cardPreviewQuery`), its title and description, then what it takes to find it again and
  adapt it, by the rules of the product layers (plan/DIRECTION.md): its id, which does not
  change, where its code is and in which frameworks, and what a product decides (`choices` in
  the front matter of the overview, a sentence); the rest is always true. Decided on
  2026-10-29: no previews in the section navigation, which stays a list of links by topic.
- Every pattern and block belongs to a topic: a group in `src/lib/nav.mjs`, with its icon
  (`GROUP_ICONS`). Building blocks start with Page structure.
- **Cases**: a pattern made of cases (Messages) reads `?case=<n>` in its example and opens on
  that case, without its demo panel and with nothing that leaves by itself;
  `PatternCases.astro` shows each one small on a card, with a button to try it. A frame that is
  `inert` makes its document inert too, so the dialogs it opens never take the focus of the
  page around it.
- Patterns connect: the list example opens the detail example (`../record-detail/?id=N`).

## Decided: where a message goes

The rule: **a message goes where the thing it talks about is.**

| Case                                                                                 | Where                                                  | Component                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------- |
| A field                                                                              | under the field                                        | `mds-input-field` message         |
| A part of the page that failed (a list did not load)                                 | in that part, with Try again; what was on screen stays | `mds-banner` error                |
| An action that failed while its place is open (save in a dialog)                     | in the dialog; what was written stays                  | `mds-banner` error                |
| An action that succeeded whose place is gone (dialog closed, record deleted, copied) | toast, 5 s, always after create, edit, delete          | `mds-toast` success               |
| The same, failed                                                                     | a toast that stays, with Try again                     | `mds-toast` error, `duration="0"` |
| A decision before going on                                                           | dialog                                                 | `mds-modal`                       |
| The whole application, informative (offline, back online)                            | toast                                                  | `mds-toast`                       |
| Never                                                                                | internal messages, raw HTTP status text, "coming soon" |                                   |

- Toasts at `bottom-center`, the same in every product, at most three at once: one
  `mds-toast-region` per application, which lines them up and reads each one out (2.4.0). A
  toast with an action has no timer and a way to close it (`dismissible`, its hide button); the
  focus goes back to the page when it closes.
- Toasts never sit above an open dialog: `showModal()` makes everything outside the dialog
  inert, and a click on the toast closes the dialog. Anything about a dialog goes into it.
- To confirm: the whole application with a decision and a deadline (session ending) becomes a
  strict dialog, also over an open dialog. Agreed first as a toast, changed after the sketch.
- The Record detail draft shows a toast when an action in its dialog fails: by the third rule
  it should be a banner in the dialog.

## Open decisions

Proposals, not decided yet:

- **Destructive actions**: an irreversible action always asks, naming the object and the
  consequence.
- **Form fields and validation**: always `mds-input-field` with a visible label; validate on
  submit, then field by field as it changes; never disable submit to signal errors.
- **Dialog with a form**: `mds-modal` with its own structure (title on top, actions at the
  bottom, its close button and Escape), two widths.
- **Paging**: a paginator for tables people work through, "Load more" for browsing results, no
  automatic infinite scroll.
- **Loading**: a skeleton for the first load of a region, `await` on the control that started
  an action, results stay while the next ones load.
- **Empty states**: `mds-zero` with a way out, never a warning tone.
- **Permissions**: hide what a role can never do; disable, with the reason, what depends on the
  state of the record.
- **AI**: one way to disclose each case (generated content, prompt input, field filled by AI).
- **Navigation within a page**: `mds-tab` for views of the same object, links for pages.
- **Page title**: always the `h1`; its size comes from `typography`, not from the level.
- **Not ready yet**: features that are not ready are not shown.

Proposed order: messages and states (where a message goes - the Messages draft -,
confirmation, empty and error states, loading), then forms
(field, dialog with a form, then the Form and validation pattern), then List with filters with
row actions, Record detail, search with facets (after a combobox in Magma), AI.
