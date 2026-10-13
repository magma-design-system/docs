// Markdown text as Magma components: a plugin for Astro's Markdown processor
// (Satteri), added by the Magma integration (src/integrations/magma.mjs) after
// the tables (markdown-tables.mjs), so it runs on the pages and on the Magma
// docs of the components loader.
// Headings become mds-text with their typography and tag, paragraphs mds-text
// `detail` (Magma's body text, 1rem: `paragraph` is 1.25rem, for long
// reading), inline code mds-text `snippet`, or `hack` (smaller) in table
// cells (code blocks stay as they are),
// lists mds-list and mds-list-item, rules mds-hr. Ordered lists stay <ol>:
// mds-list has no numbered form.
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
  heading: {
    h1: 'block',
    h2: 'block mt-1200 first:mt-0',
    h3: 'block mt-1000 first:mt-0',
    h4: 'block mt-800 first:mt-0',
    h5: 'block mt-800 first:mt-0',
    h6: 'block mt-800 first:mt-0',
  },
  paragraph: 'block max-w-(--spacing-text)',
  // mds-text gives `tag="code"` its own look (background, ring, radius):
  // kept in running text; where code stays compact, no ring and a lighter
  // background.
  code: { snippet: '', hack: 'shadow-none bg-wash-soft' },
  // What a table row is about (props, events, ...): bold, no background.
  name: 'bg-transparent p-0 text-fg-default shadow-none',
  listItem: 'mt-0 [&::part(text)]:block',
};

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

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
 * and records it for the table of contents; `compact` is set inside table
 * cells.
 * @param {any} node
 * @param {(heading: any) => string | undefined} heading
 * @param {boolean} [compact]
 * @returns {any}
 */
function convert(node, heading, compact = false) {
  if (node.type !== 'element') {
    return node.children
      ? { ...node, children: node.children.map((child) => convert(child, heading, compact)) }
      : node;
  }
  // Code blocks: highlighted by Astro, nothing in Magma replaces them.
  if (node.tagName === 'pre') return node;

  const inCell = compact || node.tagName === 'mds-table-cell';
  const children = () => (node.children ?? []).map((child) => convert(child, heading, inCell));
  const tag = node.tagName;

  if (HEADINGS.has(tag)) {
    const id = heading(node);
    return element(
      'mds-text',
      { ...own(node), ...(id && { id }), typography: tag, tag },
      TEXT.heading[/** @type {keyof typeof TEXT.heading} */ (tag)],
      children(),
    );
  }
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
      { ...own(node), typography: compact ? 'hack' : 'snippet', tag: 'code' },
      compact ? TEXT.code.hack : TEXT.code.snippet,
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
