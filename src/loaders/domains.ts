import type { Loader } from 'astro/loaders';
import { loadDomains } from '../lib/magma.mjs';
import { PROSE_CELLS_FIELD } from '../lib/markdown-tables.mjs';
import { DOMAINS } from '../lib/nav.mjs';

// Relative links to .md files: the files of agents/patterns/ link each other by
// name (`rhythm.md`). A link to a domain becomes a link to its page on the
// site; the others (a pattern, a guide of the package) have no page here: keep
// the link text, drop the link.
const RELATIVE_MD_LINK = /\[([^\]]+)\]\((?!https?:|#)(?:\.\/)?([^)]*?)\.md(?:#[^)]*)?\)/g;

/**
 * The body of a domain as the page shows it: without its h1 (the page title,
 * PageTitle.astro), the notes for its maintainers (`<!-- Generated from the
 * frontmatter ... -->` above the generated sections) and the links that have
 * no page on the site. The bold principle under the h1 stays, as the lead.
 */
function pageBody(body: string, ids: Set<string>): string {
  return body
    .replace(/^#\s[^\n]*\n/m, '')
    .replace(/<!--[\s\S]*?-->\n?/g, '')
    .replace(RELATIVE_MD_LINK, (_, label: string, target: string) =>
      ids.has(target) ? `[${label}](../${target}/)` : label,
    );
}

/**
 * The domains of the design language, from the installed magma
 * (`agents/patterns/<id>.md`, `kind: foundation`): one page each under
 * Foundation (src/pages/[...locale]/foundation/[domain].astro), the whole file
 * as Magma ships it to the agents. A domain DOMAINS (src/lib/nav.mjs) does not
 * list fails the build: left out, it would have no place in the navigation.
 */
export function domainsLoader(): Loader {
  return {
    name: 'magma-domains',
    async load({ store, logger, parseData, renderMarkdown, generateDigest }) {
      const shipped = loadDomains();
      const known = new Set(DOMAINS.map(({ id }) => id));
      const unknown = shipped.filter(({ id }) => !known.has(id)).map(({ id }) => id);
      if (unknown.length)
        throw new Error(
          `magma ships the domain(s) ${unknown.join(', ')}, which have no place on the site: add them to DOMAINS in src/lib/nav.mjs, with their UI strings nav.foundation.<id>`,
        );
      const ids = new Set(shipped.map(({ id }) => id));

      store.clear();
      for (const domain of shipped) {
        // The YAML of the frontmatter, read by Astro's Markdown processor.
        const { metadata: head } = await renderMarkdown(`---\n${domain.frontmatter}\n---\n`);
        const frontmatter = head?.frontmatter ?? {};
        const { html, metadata } = await renderMarkdown(
          `---\n${PROSE_CELLS_FIELD}: true\n---\n${pageBody(domain.body, ids)}`,
        );
        const data = await parseData({
          id: domain.id,
          data: {
            title: String(frontmatter.title ?? domain.id),
            need: String(frontmatter.need ?? '').trim(),
            principle: String(frontmatter.principle ?? '').trim(),
            html,
            headings: metadata?.headings ?? [],
          },
        });
        store.set({ id: domain.id, data, digest: generateDigest(data) });
      }
      logger.info(
        shipped.length
          ? `Loaded ${shipped.length} domains of the design language from magma`
          : 'The installed magma ships no domain of the design language: no Composition pages',
      );
    },
  };
}
