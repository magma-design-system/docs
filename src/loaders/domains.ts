import type { Loader } from 'astro/loaders';
import { loadDomains, type Preview } from '../lib/magma.mjs';
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
 * The sections whose items Magma may show at work, by the key of the
 * frontmatter that lists the items: a preview is named after a case, or after
 * a rule that is always true ("The preview of a case" in Magma's
 * docs/PATTERNS.md; the first are the rules of actions, in 2.10.0).
 */
const PREVIEWED = [
  { of: 'case', heading: 'Cases', key: 'cases' },
  { of: 'rule', heading: 'Always true', key: 'always-true' },
] as const;

/**
 * The body cut after each section with previews, where the page shows them
 * (DomainPreviews.astro): each part is the text up to the h2 after such a
 * section, with the previews of its items in their order. The last part, the
 * text after the last cut, has none; the whole body is one part for a domain
 * with no preview.
 */
function splitAfterPreviewed(
  body: string,
  previewed: Array<{ heading: string; previews: Preview[] }>,
): Array<{ text: string; previews: Preview[] }> {
  const cuts = previewed
    .filter(({ previews }) => previews.length)
    .map(({ heading, previews }) => {
      const section = new RegExp(`^## ${heading}[ \\t]*$`, 'm').exec(body);
      if (!section)
        throw new Error(`Previews of the ${heading} of a domain that has no ${heading}`);
      const from = section.index + section[0].length;
      const next = /^## /m.exec(body.slice(from));
      return { at: next ? from + next.index : body.length, previews };
    })
    .sort((a, b) => a.at - b.at);
  const parts: Array<{ text: string; previews: Preview[] }> = [];
  let from = 0;
  for (const { at, previews } of cuts) {
    parts.push({ text: body.slice(from, at), previews });
    from = at;
  }
  if (from < body.length || !parts.length) parts.push({ text: body.slice(from), previews: [] });
  return parts;
}

/**
 * The domains of the design language, from the installed magma
 * (`agents/patterns/<id>.md`, `kind: foundation`): one page each under
 * Foundation (src/pages/[...locale]/foundation/[domain].astro), the whole file
 * as Magma ships it to the agents, with the previews of its cases after its
 * Cases and those of its rules after its Always true, in the order of the
 * frontmatter. A domain DOMAINS (src/lib/nav.mjs) does not list fails the
 * build: left out, it would have no place in the navigation; so does a preview
 * of no case or rule of the domain.
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
        // The tables of a domain are prose.
        const render = (text: string) =>
          renderMarkdown(`---\n${PROSE_CELLS_FIELD}: true\n---\n${text}`);
        // The previews of each section, in the order of its items.
        const previewed = PREVIEWED.map(({ of, heading, key }) => {
          const items: string[] = (frontmatter[key] ?? []).map((entry: { id: string }) => entry.id);
          const previews = domain.previews
            .filter((one) => items.includes(one.id))
            .sort((a, b) => items.indexOf(a.id) - items.indexOf(b.id))
            .map((one) => ({ ...one, of }));
          return { heading, previews };
        });
        const shown = new Set(previewed.flatMap(({ previews }) => previews.map((one) => one.id)));
        const strays = domain.previews.filter((one) => !shown.has(one.id));
        if (strays.length)
          throw new Error(
            `magma ships previews of ${domain.id} for no case or rule of it: ${strays.map((one) => one.id).join(', ')}`,
          );
        const parts = await Promise.all(
          splitAfterPreviewed(pageBody(domain.body, ids), previewed).map(
            async ({ text, previews }) => {
              const { html, metadata } = await render(text);
              return { html, headings: metadata?.headings ?? [], previews };
            },
          ),
        );
        const data = await parseData({
          id: domain.id,
          data: {
            title: String(frontmatter.title ?? domain.id),
            need: String(frontmatter.need ?? '').trim(),
            principle: String(frontmatter.principle ?? '').trim(),
            parts,
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
