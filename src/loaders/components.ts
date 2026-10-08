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

/**
 * Drops the leading "# mds-tag" heading (the page already has a title) and
 * demotes the other headings by one level, so they nest under "Overview".
 */
function readmeBody(markdown: string): string {
  return markdown.replace(/^#\s+[^\n]*\n+/, '').replace(/^(#{2,5})\s/gm, '#$1 ');
}

export function componentsLoader(): Loader {
  return {
    name: 'magma-components',
    async load({ store, logger, parseData, renderMarkdown, generateDigest }) {
      const { components } = loadComponentDocs();
      let deadLinks = 0;

      const render = async (markdown: string | undefined) => {
        if (!markdown?.trim()) return '';
        const { text, count } = unlinkUnpublished(markdown);
        deadLinks += count;
        return (await renderMarkdown(text)).html;
      };

      store.clear();
      for (const component of components) {
        const usage = [];
        for (const [key, markdown] of Object.entries<string>(component.usage ?? {})) {
          // Keys look like "1. Description": the number only sets the order.
          usage.push({ title: key.replace(/^\d+\.\s*/, ''), html: await render(markdown) });
        }

        const withHtml = async <T extends { docs?: string }>(items: T[]) =>
          Promise.all(items.map(async (item) => ({ ...item, docsHtml: await render(item.docs) })));

        const data = await parseData({
          id: component.tag,
          data: {
            tag: component.tag,
            summary: component.docs ?? '',
            readmeHtml: await render(readmeBody(component.readme ?? '')),
            usage,
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
        logger.warn(`Unlinked ${deadLinks} relative .md links not published with the package (magma#811)`);
      }
    },
  };
}
