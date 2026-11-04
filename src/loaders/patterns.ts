import type { Loader } from 'astro/loaders';
import { loadPatterns, type Preview } from '../lib/magma.mjs';
import { PROSE_CELLS_FIELD } from '../lib/markdown-tables.mjs';
import { DOMAINS, PATTERN_GROUPS, PATTERN_SECTIONS } from '../lib/nav.mjs';

// Relative links to .md files: the files of agents/patterns/ may link each
// other by name (`rhythm.md`). A link to one of them becomes a link to its
// page on the site, two levels up from /<section>/<id>/; the others (a guide
// of the package) have no page here: keep the link text, drop the link.
const RELATIVE_MD_LINK = /\[([^\]]+)\]\((?!https?:|#)(?:\.\/)?([^)]*?)\.md(?:#[^)]*)?\)/g;

/**
 * The body of a file as its page shows it: without its h1 (the page title,
 * PageTitle.astro), the notes for its maintainers (`<!-- Generated from the
 * frontmatter ... -->` above the generated sections) and the links that have
 * no page on the site. The bold principle under the h1 stays, as the lead.
 */
function pageBody(body: string, sections: Map<string, string>): string {
  return body
    .replace(/^#\s[^\n]*\n/m, '')
    .replace(/<!--[\s\S]*?-->\n?/g, '')
    .replace(RELATIVE_MD_LINK, (_, label: string, target: string) => {
      const section = sections.get(target);
      return section ? `[${label}](../../${section}/${target}/)` : label;
    });
}

/**
 * The sections whose items Magma may show at work, by the key of the
 * frontmatter that lists the items: a preview is named after a case, after a
 * rule that is always true (the first are the rules of actions, in 2.10.0),
 * or after a situation of a building block, which has regions instead of
 * cases ("The preview of a case" in Magma's docs/PATTERNS.md).
 */
const PREVIEWED = [
  { of: 'case', heading: 'Cases', key: 'cases' },
  { of: 'rule', heading: 'Always true', key: 'always-true' },
  { of: 'situation', heading: 'Situations', key: 'situations' },
] as const;

/**
 * The body cut after each section with previews, where the page shows them
 * (PatternPreviews.astro): each part is the text up to the h2 after such a
 * section, with the previews of its items in their order. The last part, the
 * text after the last cut, has none; the whole body is one part for a file
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
        throw new Error(`Previews of the ${heading} of a pattern that has no ${heading}`);
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
 * What the installed magma ships in `agents/patterns/`: the domains of the
 * design language (`kind: foundation`), the patterns and the building blocks,
 * one page each in the section of its kind
 * (src/pages/[...locale]/[section]/[id].astro): the whole file as Magma ships
 * it to the agents, with the previews of its cases after its Cases, those of
 * its rules after its Always true, those of the situations of a block after
 * its Situations, in the order of the frontmatter. A candidate, a need Magma
 * knows with no default yet, has a page too: its need and a line on what the
 * agent does meanwhile. Fails the build, rather than leaving a page out of
 * the navigation: a domain DOMAINS (src/lib/nav.mjs) does not list, a pattern
 * or a block of a group PATTERN_GROUPS does not list, a preview of no case,
 * rule or situation.
 */
export function patternsLoader(): Loader {
  return {
    name: 'magma-patterns',
    async load({ store, logger, parseData, renderMarkdown, generateDigest }) {
      const shipped = loadPatterns();
      const domains = new Set(DOMAINS.map(({ id }) => id));
      const groups = new Set(PATTERN_GROUPS.map(({ id }) => id));
      const homeless = shipped.filter((pattern) =>
        pattern.kind === 'foundation' ? !domains.has(pattern.id) : !groups.has(pattern.group ?? ''),
      );
      if (homeless.length)
        throw new Error(
          `magma ships ${homeless.map(({ id, kind, group }) => `${id} (${kind}${group ? `, group ${group}` : ''})`).join(', ')}, which have no place on the site: add a domain to DOMAINS in src/lib/nav.mjs with its UI string nav.foundation.<id>, a group to PATTERN_GROUPS with its UI strings nav.patterns.<group> and nav.blocks.<group>`,
        );
      const sections = new Map(
        shipped.map(({ id, kind }) => [id, PATTERN_SECTIONS[kind]] as [string, string]),
      );

      store.clear();
      for (const pattern of shipped) {
        // The YAML of the frontmatter, read by Astro's Markdown processor.
        const { metadata: head } = await renderMarkdown(`---\n${pattern.frontmatter}\n---\n`);
        const frontmatter = head?.frontmatter ?? {};
        // The tables of a pattern are prose.
        const render = (text: string) =>
          renderMarkdown(`---\n${PROSE_CELLS_FIELD}: true\n---\n${text}`);
        // The previews of each section, in the order of its items.
        const previewed = PREVIEWED.map(({ of, heading, key }) => {
          const items: string[] = (frontmatter[key] ?? []).map(
            (entry: { id?: string }) => entry.id,
          );
          const previews = pattern.previews
            .filter((one) => items.includes(one.id))
            .sort((a, b) => items.indexOf(a.id) - items.indexOf(b.id))
            .map((one) => ({ ...one, of }));
          return { heading, previews };
        });
        const shown = new Set(previewed.flatMap(({ previews }) => previews.map((one) => one.id)));
        const strays = pattern.previews.filter((one) => !shown.has(one.id));
        if (strays.length)
          throw new Error(
            `magma ships previews of ${pattern.id} for no case, rule or situation of it: ${strays.map((one) => one.id).join(', ')}`,
          );
        const parts = await Promise.all(
          splitAfterPreviewed(pageBody(pattern.body, sections), previewed).map(
            async ({ text, previews }) => {
              const { html, metadata } = await render(text);
              return { html, headings: metadata?.headings ?? [], previews };
            },
          ),
        );
        const data = await parseData({
          id: pattern.id,
          data: {
            kind: pattern.kind,
            group: pattern.group,
            status: pattern.status,
            title: pattern.title,
            need: String(frontmatter.need ?? '').trim(),
            principle: String(frontmatter.principle ?? '').trim(),
            parts,
          },
        });
        store.set({ id: pattern.id, data, digest: generateDigest(data) });
      }
      const count = (kind: string) => shipped.filter((pattern) => pattern.kind === kind).length;
      logger.info(
        `Loaded from magma ${count('foundation')} domains of the design language, ${count('pattern')} patterns, ${count('block')} building blocks`,
      );
    },
  };
}
