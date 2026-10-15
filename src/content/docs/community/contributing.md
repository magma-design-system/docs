---
title: Contributing
description: How Magma is governed and how to take part - the roles, the ways in, the kinds of contribution, the path from a proposal to a release, and the rules every change follows.
---

Magma started with one or two people writing all of it. It is moving to a community model,
the way an open source project works: whoever uses Magma can change it. A core team moderates
the work: it decides what goes in, checks the design, reviews the code and publishes the
releases. Everything happens in the open, in the
[Magma repository](https://github.com/magma-design-system/magma) on GitHub.

## Roles

- **The core team** maintains Magma: it triages the proposals, validates the designs,
  reviews and merges the code, publishes the releases. Its job is also to help the others
  contribute: whoever proposes a contribution gets a mentor from the core team, who helps
  them past the pitfalls of a large shared codebase.
- **Contributors** are whoever proposes a change: designers, developers, product teams,
  writers. Contributing does not mean writing code: a clear bug report, or a fix to a page
  of this site, is a contribution too.
- **Product teams** use Magma in their products. When a problem shows up in a product, its
  issue says which product it comes from, so that the team hears when it is fixed.
- **AI agents** follow the same rules as people: they can open issues, branches and pull
  requests, and never merge.

## Ways in

Every contribution starts from an issue in the Magma repository, opened with the template
that matches what you want:

- **[Bug report](https://github.com/magma-design-system/magma/issues/new?template=1-bug-report.yml)**:
  something does not work.
- **[Feature request](https://github.com/magma-design-system/magma/issues/new?template=2-feature-request.yml)**:
  an idea for the core team to consider, without building it yourself.
- **[Contribution proposal](https://github.com/magma-design-system/magma/issues/new?template=3-contribution-proposal.yml)**:
  you want to build it yourself, in code or in design; the core team pairs you with a
  mentor.
- **[Documentation](https://github.com/magma-design-system/magma/issues/new?template=4-documentation.yml)**:
  something wrong, outdated or missing in the documentation.
- **[Training](https://github.com/magma-design-system/magma/issues/new?template=5-training-request.yml)**:
  training or onboarding for a person, a team or a larger group.

Search the [open issues](https://github.com/magma-design-system/magma/issues) first: the
same work may be planned already. Questions on how to use Magma go to
[Stack Overflow](https://stackoverflowteams.com/c/magma-design-system/questions), not to the
issues, and security vulnerabilities are reported
[privately](https://github.com/magma-design-system/magma/security/advisories/new).

## Kinds of contribution

The kind of a contribution decides which steps it goes through, and what kind of release it
ends in. Pick the smallest that describes your change: the core team confirms it, or changes
it, at triage.

- **Bug fix**: something that does not behave as it should. No design; a patch.
- **Small enhancement**: a small addition that does not touch how a component is built,
  such as one more color for a label. A patch or a minor.
- **Large enhancement**: a deeper change to one component, such as reworking its slots.
  With a design; a minor.
- **New feature**: a new component or capability. With a design; a minor.
- **Feature across components**: a change to how several components are built, such as an
  attribute they all share. With a design; a minor or a major.
- **Major initiative**: a change to the design system itself, such as restyling every
  component or reworking the tokens. With a design; a major.

## From a proposal to a release

The core team acts at three checkpoints: triage, design validation, and review and merge.

1. **Propose.** Open the issue: what, why, for whom, by when.
2. **Triage.** The core team accepts the proposal and confirms its kind, asks for more, or
   declines it with a reason.
3. **Design**, when the kind asks for it: in Figma, starting from Magma's libraries, with
   the tokens and the accessibility checked.
4. **Design validation.** The core team approves the design before any code is written, or
   asks for changes.
5. **Code**, on a branch created from the issue, off `dev`: a test for every change of
   behavior, a Storybook story for what changes in looks, interaction or accessibility.
6. **Pull request** into `dev`, closing its issue, with every check green.
7. **Review and merge.** A maintainer reviews the change, as deeply as its risk asks, and
   merges it.
8. **Documentation.** The documentation of a component lives with it in the Magma
   repository, and this site reads it from there; guidelines like the
   [Foundation](../../foundation/) live in the repository of this site.
9. **Release.** The maintainers promote `dev` into `main`; each package gets the version its
   own commits call for, and is published on npm with its release notes.

## Review by risk

Every pull request gets a review level, computed from what it changes, not declared:

- **Contract**: the public API of the components changes. Every changed member must be
  intended, and the release must say so.
- **Behavior**: shipped code changes. The tests must describe the new behavior, and fail on
  the old one.
- **Visual**: only CSS, tokens, styles, icons or brand assets change. The reviewer looks at
  the result, not at the CSS.
- **Low**: documentation, tests or tooling only. Green checks are enough.

Keep a pull request to one level when you can: two quick reviews are better than one long
one.

## The rules

- Every change starts from an issue, and its branch is linked to it.
- Nobody pushes to `dev` or `main`: every change goes through a pull request.
- Merging into `dev` and `main` is a maintainer's decision, never automated.
- Nothing is merged with a red check, however small the change.
- A change of behavior comes with the test that covers it.
- A breaking change is declared, and ships only in a major: see
  [Versions and migrations](../../development/versions/).
- Commits follow the Conventional Commits format, with a scope: the versions and the
  release notes are computed from them.

The decisions of the Foundation section change the same way, from a documentation issue:
see [Changing a decision](../../foundation/principles/#changing-a-decision).

## More

- [Contributor wiki](https://github.com/magma-design-system/magma/wiki): every step of the
  flow, one page per kind of contribution, the labels.
- [Contribution workflow and git governance](https://github.com/magma-design-system/magma/blob/dev/docs/WORKFLOW.md)
  and [commit message convention](https://github.com/magma-design-system/magma/blob/dev/docs/COMMITS.md),
  in the Magma repository.
- [Code of conduct](../code-of-conduct/).
- Nathan Curtis, EightShapes:
  [Why Design System Contributions Matter](https://medium.com/eightshapes-llc/why-contributions-matter-22652d8676c6),
  [Defining Design System Contribution](https://medium.com/eightshapes-llc/defining-design-system-contributions-eb48e00e8898),
  [Design System Subtasks, by Step](https://medium.com/eightshapes-llc/design-system-subtasks-by-step-2f43d7d4bce0).
