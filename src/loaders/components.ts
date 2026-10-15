import type { Loader } from 'astro/loaders';
import { loadComponentDocs } from '../lib/magma.mjs';

// Relative links to .md files that are not published with the package
// (SPEC.md, docs/COMPONENTS.md, ...): they are dead outside the monorepo.
// Keep the link text, drop the link.
// Tracked in https://github.com/magma-design-system/magma/issues/811
const RELATIVE_MD_LINK = /\[([^\]]+)\]\((?!https?:|#)[^)]*\.md(?:#[^)]*)?\)/g;

function unlinkUnpublished(markdown: string): { text: string; count: number } {
  let count = 0;
  const text = markdown.replace(RELATIVE_MD_LINK, (_, label: string) => {
    count++;
    return label;
  });
  return { text, count };
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
      let deadLinks = 0;

      const render = async (markdown: string | undefined) => {
        if (!markdown?.trim()) return { html: '', headings: [] };
        const { text, count } = unlinkUnpublished(markdown);
        deadLinks += count;
        const { html, metadata } = await renderMarkdown(text);
        return { html, headings: metadata?.headings ?? [] };
      };
      const toHtml = async (markdown: string | undefined) => (await render(markdown)).html;

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

        const withHtml = async <T extends { docs?: string }>(items: T[]) =>
          Promise.all(items.map(async (item) => ({ ...item, docsHtml: await toHtml(item.docs) })));

        const data = await parseData({
          id: component.tag,
          data: {
            tag: component.tag,
            summary: component.docs ?? '',
            // The Overview, under its h2.
            descriptionHtml: await toHtml(nestHeadings(usage.description ?? '', 3)),
            // Sub-pages of their own: their entries are the h2 of the page.
            pattern: await render(nestHeadings(usage.pattern ?? '', 2)),
            antipattern: await render(nestHeadings(usage.antipattern ?? '', 2)),
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
      if (deadLinks > 0) {
        logger.warn(
          `Unlinked ${deadLinks} relative .md links not published with the package (magma#811)`,
        );
      }
    },
  };
}
