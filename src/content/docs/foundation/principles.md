---
title: Principles
description: The four principles behind every decision of Magma - inclusive, enabling, intuitive, flexible - what each asks in practice, and which one wins when they disagree.
---

Maggioli's products are used by people who work in and with the public administration:
municipal offices, local police, technical offices, and the professionals who deal with
them every day. They work under rules and deadlines, often for hours in a row, on whatever
computer their office provides. Magma is designed for them, around four principles.

Each page of this section is a domain of decisions taken from these principles: there are no
principles for color, type or icons, only decisions that say which principle they serve.

## Inclusive

Nobody chooses a public service. The clerk uses the software the municipality bought, the
citizen uses the service the municipality offers: if the product does not work for them,
they have no alternative. So it has to work for everyone who must use it.

- Designed for WCAG 2.x AA, and for the preferences people set: dark mode, more contrast,
  less motion, lower consumption.
- Light on the device and on the network: offices keep their computers for years, and not
  every connection is fast.
- The words of the people who use the product, not those of the law or of the code.

More in [Accessibility](../accessibility/) and [Inclusive language](../inclusive-language/).

## Enabling

The work done with these products has consequences: a deadline met, a payment made, a deed
filed. People must be able to finish it, and to know they finished it well.

- The most frequent task comes first; the others stay one step away, not hidden.
- Long procedures are split into steps, each asking only for what it needs.
- Repetitive work is automated, or done on many items at once.
- Friction only where it protects: a confirmation before what cannot be undone, never before
  what can.
- An error says what happened and what to do next. Recovering from it costs less than making
  it.
- The product suggests, the user decides. What an AI produced is always marked as such, with
  `mds-policy-ai`, so the user knows what to check.

## Intuitive

Most people use more than one Maggioli product, many of them every day for years. What they
learned in one should work in the next.

- The same problem gets the same solution in every product: a pattern is used for the same
  reason and in the same way, or it is not a pattern.
- The conventions of the web and of the platform come before new inventions: a custom
  interaction has to be learned, a standard one is already known.
- One concept, one name, one icon.
- Every element on a screen earns its place by helping the task; the rest goes.

## Flexible

Magma serves a group of companies, brands and products, some new, some built long before
Magma. It has to fit all of them without splitting into one design system each.

- A brand changes Magma through tokens and themes, never by forking a component.
- The brand steps forward on editorial and promotional pages, and back in the tools where
  people work.
- Adoption is gradual: an existing product can start from the tokens and move to the
  components one screen at a time.
- The components are web components, so they work in the framework a product already has.

## When they disagree

Principles pull in different directions: the brand color that is not legible enough as
text, the shortcut that only some users can reach, the familiar pattern that does not fit a
new kind of task. When they do, they win in their order:

1. **Inclusive**: a choice that leaves someone out is not acceptable, however quick,
   familiar or on brand it is.
2. **Enabling**: then, what lets people finish their work.
3. **Intuitive**: then, what they already know.
4. **Flexible**: then, what adapts to the brand and the product.

## Changing a decision

The decisions of this section change the way the code does: someone proposes, the
community discusses, the core team reviews. A proposal says which principle it serves, and
which decision it replaces. Open it with the
[documentation issue](https://github.com/magma-design-system/magma/issues/new?template=4-documentation.yml)
of the Magma repository.
