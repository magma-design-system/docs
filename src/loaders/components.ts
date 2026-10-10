import type { Loader } from 'astro/loaders';
import { loadComponentDocs } from '../lib/magma.mjs';

// Relative links to .md files. The usage docs are written next to the
// per-component docs of the package (dist/collection/components/<tag>/), so a
// link to another component (`../mds-button/AGENTS.md`) becomes a link to its
// page on the site. The others lead to Magma's agent guides
// (`../../../../agents/*.md`) or to the component's own AGENTS.md, which have
// no page on the site: keep the link text, drop the link.
const RELATIVE_MD_LINK = /\[([^\]]+)\]\((?!https?:|#)([^)]*\.md)(?:#[^)]*)?\)/g;
const COMPONENT_DOC = /^\.\.\/(mds-[a-z0-9-]+)\/AGENTS\.md$/;

/**
 * Rewrites the relative .md links of a usage doc for a page `depth` levels
 * below the component's main page (0 for the overview, 1 for its sub-pages).
 * Links between pages stay relative, so they keep the locale of the page.
 */
function rewriteLinks(
  markdown: string,
  depth: number,
  tags: Set<string>,
): { text: string; unlinked: number } {
  let unlinked = 0;
  const text = markdown.replace(RELATIVE_MD_LINK, (_, label: string, target: string) => {
    const tag = COMPONENT_DOC.exec(target)?.[1];
    if (tag && tags.has(tag)) return `[${label}](${'../'.repeat(depth + 1)}${tag}/)`;
    unlinked++;
    return label;
  });
  return { text, unlinked };
}

const HEADING = /^(#{1,6})(?=\s)/;

/**
 * Moves the headings so the shallowest one becomes `level`, keeping how they
 * nest. Fenced code is left alone: there a leading "#" is a comment.
 */
function nestHeadings(markdown: string, level: number): string {
  let fenced = false;
  const lines = markdown.split('\n').map((text) => {
    if (/^\s*(```|~~~)/.test(text)) fenced = !fenced;
    return { text, depth: fenced ? 0 : (HEADING.exec(text)?.[1].length ?? 0) };
  });
  const depths = lines.map((line) => line.depth).filter((depth) => depth > 0);
  if (depths.length === 0) return markdown;
  const shift = level - Math.min(...depths);
  return lines
    .map(({ text, depth }) =>
      depth > 0 ? '#'.repeat(Math.min(6, depth + shift)) + text.slice(depth) : text,
    )
    .join('\n');
}

/**
 * Usage files of a component, by name: "1. Description" -> "description".
 * They are the whole hand-written documentation of a component, as in Magma's
 * per-component agent docs. The readme is not used: beyond a generic intro it
 * is outdated or repeats them (magma#842).
 */
const USAGE = ['description', 'pattern', 'antipattern'] as const;
type Usage = (typeof USAGE)[number];

export function componentsLoader(): Loader {
  return {
    name: 'magma-components',
    async load({ store, logger, parseData, renderMarkdown, generateDigest }) {
      const { components } = loadComponentDocs();
      const tags = new Set<string>(components.map((c: { tag: string }) => c.tag));
      let unlinked = 0;

      // `depth`: 0 for what goes on the overview, 1 for the sub-pages.
      const render = async (markdown: string | undefined, depth: number) => {
        if (!markdown?.trim()) return { html: '', headings: [] };
        const rewritten = rewriteLinks(markdown, depth, tags);
        unlinked += rewritten.unlinked;
        const { html, metadata } = await renderMarkdown(rewritten.text);
        return { html, headings: metadata?.headings ?? [] };
      };
      const toHtml = async (markdown: string | undefined, depth: number) =>
        (await render(markdown, depth)).html;

      store.clear();
      for (const component of components) {
        const usage: Partial<Record<Usage, string>> = {};
        for (const [key, markdown] of Object.entries<string>(component.usage ?? {})) {
          // Keys look like "1. Description": the number only sets the order.
          const name = key.replace(/^\d+\.\s*/, '').toLowerCase();
          if (USAGE.includes(name as Usage)) {
            usage[name as Usage] = markdown;
          } else {
            logger.warn(`${component.tag}: usage "${key}" has no place on the site, left out`);
          }
        }

        // On the API and CSS sub-pages.
        const withHtml = async <T extends { docs?: string }>(items: T[]) =>
          Promise.all(
            items.map(async (item) => ({ ...item, docsHtml: await toHtml(item.docs, 1) })),
          );

        const data = await parseData({
          id: component.tag,
          data: {
            tag: component.tag,
            summary: component.docs ?? '',
            // The Overview, under its h2.
            descriptionHtml: await toHtml(nestHeadings(usage.description ?? '', 3), 0),
            // Sub-pages of their own: their entries are the h2 of the page.
            pattern: await render(nestHeadings(usage.pattern ?? '', 2), 1),
            antipattern: await render(nestHeadings(usage.antipattern ?? '', 2), 1),
            props: await withHtml(component.props),
            events: await withHtml(component.events),
            methods: await withHtml(component.methods),
            slots: await withHtml(component.slots),
            styles: await withHtml(component.styles),
            parts: await withHtml(component.parts),
            dependents: component.dependents,
            dependencies: component.dependencies,
            encapsulation: component.encapsulation,
          },
        });
        store.set({ id: component.tag, data, digest: generateDigest(data) });
      }

      logger.info(`Loaded ${components.length} components from documentation.json`);
      if (unlinked > 0) {
        logger.info(`Unlinked ${unlinked} links to agent docs that have no page on the site`);
      }
    },
  };
}
