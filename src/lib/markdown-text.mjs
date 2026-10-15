// Markdown text as Magma components: a plugin for Astro's Markdown processor
// (Satteri), added by the Magma integration (src/integrations/magma.mjs) after
// the tables (markdown-tables.mjs), so it runs on the pages and on the Magma
// docs of the components loader.
// Headings become mds-text with their typography and tag, paragraphs mds-text
// `detail` (Magma's body text, 1rem: `paragraph` is 1.25rem, for long
// reading), inline code mds-text `hack` but in headings, where it is plain
// text (code blocks stay as they are),
// lists mds-list and mds-list-item, rules mds-hr. Ordered lists stay <ol>:
// mds-list has no numbered form. Section headings (h2, h3) get an anchor in
// front of them, an mds-button that links to them (`anchoredHeading`), in
// place of Starlight's, which the deeper ones lose.
//
// mds-text and mds-list-item are meant for plain text, while Markdown puts
// code, links and bold in paragraphs and list items. mds-text is a flex box,
// which would lay each of them out as an item of its own: TEXT.block makes it
// a block again, so they flow inline (inside mds-list-item, through its `text`
// part).
import { satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';

/**
 * Utilities of the elements, also used by the pages that write the same
 * elements by hand. Paragraphs keep the reading measure (`--spacing-text`, see
 * src/styles/magma.css). Starlight puts 1rem between the blocks of a page;
 * headings get more above them, and list items none: mds-list has its own gap.
 */
export const TEXT = {
  block: 'block',
  // `scroll-mt-600`: a link to a heading leaves 1.5rem above it. Starlight's
  // scroll padding (1.5rem and --sl-nav-height) stops right at the bottom of
  // the mobile header, which sits 1.5rem below the top of the page.
  heading: {
    h1: 'block scroll-mt-600',
    h2: 'block scroll-mt-600 mt-1200 first:mt-0',
    h3: 'block scroll-mt-600 mt-1000 first:mt-0',
    h4: 'block scroll-mt-600 mt-800 first:mt-0',
    h5: 'block scroll-mt-600 mt-800 first:mt-0',
    h6: 'block scroll-mt-600 mt-800 first:mt-0',
  },
  // The heading of an anchored row (below), without the space above it.
  headingText: 'block scroll-mt-600',
  // A heading with its anchor, in a row that takes the space above the
  // heading. `not-content`: Starlight would put 1rem above the heading, since
  // it follows the anchor.
  anchored: {
    h2: 'not-content flex items-start mt-1200 first:mt-0',
    h3: 'not-content flex items-start mt-1000 first:mt-0',
  },
  // The box of the anchor, by the heading's typography: one line of it
  // (`anchor-line`, see src/styles/magma.css), so the anchor sits on the
  // middle of the heading's first line at every size. h4 to h6 have the
  // anchor closer to the text, and h6 one step higher (by eye: 25, the
  // smallest of Magma's sizes; h5 would want half of it, which has no token).
  anchorLine: {
    h1: 'anchor-line text-title-h1 me-300',
    h2: 'anchor-line text-title-h2 me-300',
    h3: 'anchor-line text-title-h3 me-300',
    h4: 'anchor-line text-title-h4 me-150',
    h5: 'anchor-line text-title-h5 me-150',
    h6: 'anchor-line text-title-h6 me-150 *:-translate-y-25',
  },
  paragraph: 'block max-w-(--spacing-text)',
  // Inline code, everywhere: mds-text `hack` (0.875rem), without the ring
  // and with a lighter background than mds-text gives `tag="code"`.
  code: 'shadow-none bg-wash-soft',
  // What a table row is about (props, events, ...): bold, no background.
  name: 'bg-transparent p-0 text-fg-default shadow-none',
  listItem: 'mt-0 [&::part(text)]:block',
};

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
/** The headings that get an anchor: the sections of a page and their parts. */
const ANCHORED = new Set(['h2', 'h3']);

/**
 * The anchor of a heading: an icon button that links to it (the link icon is
 * collected by iconsauce from this file). Heading.astro writes the same. A
 * click also copies the address of the heading (HeadingAnchors.astro).
 * Centered in its box (TEXT.anchorLine), whose height its negative block
 * margins leave to the line: a button taller than the line overflows it.
 */
export const ANCHOR = {
  'data-heading-anchor': '',
  icon: 'mi/baseline/link',
  variant: 'dark',
  class: '-my-4000 self-center',
  tone: 'text',
  size: 'md',
};

/** Starlight's label for the anchor, for text that Starlight did not give one. */
const anchorLabel = (/** @type {string} */ title) => `Section titled \u201c${title}\u201d`;

/** The text of an element, without its markup. */
const textOf = (/** @type {any} */ node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join('');

/** The classes of an element, however the processor wrote them. */
const classesOf = (/** @type {any} */ node) =>
  [node.properties?.className, node.properties?.class]
    .flat()
    .filter(Boolean)
    .flatMap((value) => String(value).split(/\s+/));

/**
 * @param {string} tagName
 * @param {Record<string, unknown>} properties
 * @param {string} className
 * @param {any[]} children
 */
const element = (tagName, properties, className, children) => ({
  type: 'element',
  tagName,
  properties: className ? { ...properties, class: className } : properties,
  children,
});

/** Properties of a Markdown element to carry over, without its classes. */
const own = (/** @type {any} */ node) => {
  const { className: _className, class: _class, ...rest } = node.properties ?? {};
  return rest;
};

/**
 * The tree with its text elements replaced. `heading` gives a heading its id
 * and records it for the table of contents.
 * @param {any} node
 * @param {(heading: any) => string | undefined} heading
 * @returns {any}
 */
function convert(node, heading) {
  if (node.type !== 'element') {
    return node.children
      ? { ...node, children: node.children.map((child) => convert(child, heading)) }
      : node;
  }
  // Code blocks: highlighted by Astro, nothing in Magma replaces them.
  if (node.tagName === 'pre') return node;

  const children = () => (node.children ?? []).map((child) => convert(child, heading));
  const tag = node.tagName;

  // Starlight's heading with its anchor: the heading with ours instead,
  // under Starlight's label, which is in the language of the page.
  if (tag === 'div' && classesOf(node).includes('sl-heading-wrapper')) {
    const inner = (node.children ?? []).filter(
      (/** @type {any} */ child) => child.type === 'element',
    );
    const title = inner.find((/** @type {any} */ child) => HEADINGS.has(child.tagName));
    const link = inner.find((/** @type {any} */ child) =>
      classesOf(child).includes('sl-anchor-link'),
    );
    const label =
      link &&
      (link.children ?? []).find((/** @type {any} */ child) =>
        classesOf(child).includes('sr-only'),
      );
    if (title) return convertHeading(title, heading, label ? textOf(label) : undefined);
  }
  if (HEADINGS.has(tag)) return convertHeading(node, heading);
  if (tag === 'p') {
    return element(
      'mds-text',
      { ...own(node), typography: 'detail', tag: 'p' },
      TEXT.paragraph,
      children(),
    );
  }
  if (tag === 'code') {
    return element(
      'mds-text',
      { ...own(node), typography: 'hack', tag: 'code' },
      TEXT.code,
      node.children ?? [],
    );
  }
  if (tag === 'ul') {
    const items = (node.children ?? []).filter(
      (/** @type {any} */ child) => child.type === 'element' && child.tagName === 'li',
    );
    return element(
      'mds-list',
      own(node),
      '',
      items.map((/** @type {any} */ item) =>
        element(
          'mds-list-item',
          { ...own(item), typography: 'detail' },
          TEXT.listItem,
          (item.children ?? []).map((/** @type {any} */ child) => convert(child, heading)),
        ),
      ),
    );
  }
  if (tag === 'hr') return element('mds-hr', own(node), '', []);
  return { ...node, children: children() };
}

/**
 * Inline code of a heading as plain text in the heading's font: a small code
 * label in a large title breaks its line, and the table of contents, the
 * anchors' labels and the search show headings as plain text anyway.
 * @param {any[]} nodes
 * @returns {any[]}
 */
const withoutCode = (nodes) =>
  nodes.flatMap((node) => {
    if (node.type !== 'element') return [node];
    if (node.tagName === 'code') return withoutCode(node.children ?? []);
    return [{ ...node, children: withoutCode(node.children ?? []) }];
  });

/**
 * A heading as mds-text, with its typography and tag; h2 and h3 with an anchor
 * in front of them (Heading.astro writes the same). `label`: the anchor's
 * accessible name, Starlight's English one if not given.
 * @param {any} node
 * @param {(heading: any) => string | undefined} heading
 * @param {string} [label]
 */
function convertHeading(node, heading, label) {
  const tag = node.tagName;
  const id = heading(node);
  const children = withoutCode(node.children ?? []).map((/** @type {any} */ child) =>
    convert(child, heading),
  );
  if (!id || !ANCHORED.has(tag)) {
    return element(
      'mds-text',
      { ...own(node), ...(id && { id }), typography: tag, tag },
      TEXT.heading[/** @type {keyof typeof TEXT.heading} */ (tag)],
      children,
    );
  }
  return element('div', {}, TEXT.anchored[/** @type {keyof typeof TEXT.anchored} */ (tag)], [
    element('span', {}, TEXT.anchorLine[/** @type {keyof typeof TEXT.anchorLine} */ (tag)], [
      element(
        'mds-button',
        {
          href: `#${id}`,
          role: 'link',
          ...ANCHOR,
          'aria-label': label ?? anchorLabel(textOf(node)),
        },
        '',
        [],
      ),
    ]),
    element('mds-text', { ...own(node), id, typography: tag, tag }, TEXT.headingText, children),
  ]);
}

export function magmaText() {
  // A factory: Satteri calls it for each document, so the heading ids start
  // again on every page.
  return () => {
    // Astro gives headings their id and lists them for the table of contents
    // after the other plugins, and only on h1-h6: do it here, with its plugin,
    // before they become mds-text.
    const ids = satteriHeadingIdsPlugin()();
    return {
      name: 'magma-text',
      /**
       * @param {any} root
       * @param {any} ctx
       */
      before(root, ctx) {
        /** @param {any} node */
        const heading = (node) => {
          ids.element.visit(node, ctx);
          return node.properties?.id ?? ctx.data.astro?.headings?.at(-1)?.slug;
        };
        ctx.replaceNode(root, convert(root, heading));
      },
    };
  };
}
