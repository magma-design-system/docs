# Content structure

Decision record for the information architecture of the site. Source: the internal deck
"Magma Design System - Introduzione" (50 slides), reworked for a public documentation site.
Decided on 2026-10-08.

## Navigation (8 rail items)

| Rail                | Pages                                                                                                           | Source                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Introduction (home) | What Magma is, Why Magma, Adoption levels                                                                       | deck                                |
| Foundation          | Values, Design principles, Accessibility, Ecology, Content (voice and tone, grammar, naming)                    | deck + new writing                  |
| Tokens              | Colors, typography, motion, spacing, editor autocomplete setup                                                  | `design-tokens`, `styles`           |
| Icons               | Library, semantic dictionary                                                                                    | `svg-icons`, `icons`                |
| Components          | One page per component                                                                                          | `magma/dist/documentation.json`     |
| Brands / Assets     | Logos, illustrations, avatars                                                                                   | `identity`                          |
| Development         | Install (Vanilla / React / Angular), integrating existing vs new products, versioning and migrations, AI agents | deck + `AGENTS.md`                  |
| Community           | Support, feature requests, contributions, training                                                              | deck + Magma GitHub issue templates |

Rule: Magma data (components, tokens, icons, brand assets, agent guides) comes only from
`node_modules`. Guidelines prose (principles, content design, patterns) is written here.

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
   data file (`authors.json`, email -> name and role).
3. Component preview: inline, driven by the attributes table. Iframe only for full demos.
4. Component "Documentation" column: each entry (Anatomy, API, CSS, Features, Pattern,
   Antipattern, Installation) is a sub-page of the component. What goes into Anatomy is
   still to be defined. The usage Description opens the component's main page (Overview);
   Pattern and Antipattern are separate sub-pages, so the right and the wrong forms are
   never mixed (decided 2026-10-09).
