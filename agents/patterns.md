# Patterns and building blocks

The two sections after Components. Why they exist and what they will hold:
[plan/DIRECTION.md](../plan/DIRECTION.md) ("Patterns section", "Building blocks section").

- A **component** is one Magma element.
- A **building block** is a group of components that screens reuse in the same arrangement (page
  header, filter bar, empty state, confirmation dialog): structure and layout, no data, no
  business logic. A part of a screen becomes a block when it comes back in two or three
  patterns; blocks are not designed in advance.
- A **pattern** is a whole screen or task: blocks plus behavior over time (state, what follows
  an action, loading, errors, focus), with code in HTML, React and Angular.

## State

- Both sections are online only as their landing pages, under construction (`soon: true`).
- Pattern pages, drafts (`draft: true`, dev only): **List with filters**, **Record detail**.
- **Feedback** has a clickable sketch, `src/patterns/feedback/example.html`, and no page yet.

## How a pattern is made

One topic at a time:

1. Collect the real cases from Maggioli's products: the screens, situations, data and roles
   where the need shows up. The products are a catalogue of needs, never the solution to
   document: most of their screens were not designed with the design system.
2. Check what Magma already offers: the component guides, their `pattern.md`.
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

- `src/patterns/<id>/example.html`: plain HTML and a script, the demo in English. It is also
  the live preview, `/docs/example/pattern/<id>/` (`src/pages/example/pattern/[id].astro`), built
  in production only for published pattern pages.
- `react.tsx` and `angular.ts`: the same screen. They are outside the site's type check
  (`tsconfig.json`): check them in a scratch project with `tsc` (React 19, strict) and `ngc`
  (Angular 20 or later, `strictTemplates`).
- `src/lib/patterns.ts` reads them; `PatternPreview.astro`, `PatternCode.astro` and
  `PatternComponents.astro` (the components used, read from the example) show them.
- The page, `src/content/docs/patterns/<id>.mdx` and its Italian twin, in this order: preview,
  when to use it, anatomy, components, behavior, accessibility, content, mistakes to avoid,
  code.
- Patterns connect: the list example opens the detail example (`../record-detail/?id=N`).

## Decided: feedback

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
  toast with an action has no timer and a way to close it (`deletable`, its hide button); the
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
- **Naming**: components already have Pattern and Antipattern sub-pages (from `pattern.md`);
  either the section takes another name, or the sub-pages are labelled differently.

Proposed order: feedback (messages, confirmation, empty and error states, loading), then forms
(field, dialog with a form, then the Form and validation pattern), then List with filters with
row actions, Record detail, search with facets (after a combobox in Magma), AI.
