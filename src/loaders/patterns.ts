import type { Loader } from 'astro/loaders';
import { loadPatterns } from '../lib/magma.mjs';
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
 * The items Magma may show at work, by the key of the frontmatter that lists
 * them, in the order the page offers their previews (PatternStage.astro): a
 * preview is named after a case, after a rule that is always true (the rules
 * of actions, since 2.10.0), or after a situation of a building block, which
 * has regions instead of cases ("The preview of a case" in Magma's
 * docs/PATTERNS.md).
 */
const PREVIEWED = [
  { of: 'case', key: 'cases' },
  { of: 'rule', key: 'always-true' },
  { of: 'situation', key: 'situations' },
] as const;

// An inline code of the rendered body, as src/lib/markdown-text.mjs writes it.
const INLINE_CODE = /(<mds-text\b[^>]*\btag="code"[^>]*>)([a-z0-9-]+)(<\/mds-text>)/g;

/**
 * The ids of the previews written as inline code in the body (the first
 * column of the table of the cases, a rule that names another) link to the
 * stage at the top of the page, which runs that preview: an mds-link inside
 * the code, as every link on code of the site (agents/writing.md, Links). The
 * address works without the script of the stage too, which reads it.
 */
function linkPreviews(html: string, ids: Set<string>): string {
  return html.replace(INLINE_CODE, (whole, open: string, id: string, close: string) =>
    ids.has(id)
      ? `${open}<mds-link href="?preview=${id}#try" data-try-preview="${id}">${id}</mds-link>${close}`
      : whole,
  );
}

/**
 * What the installed magma ships in `agents/patterns/`: the domains of the
 * design language (`kind: design-language`), the patterns and the building blocks,
 * one page each in the section of its kind
 * (src/pages/[...locale]/[section]/[id].astro): the whole file as Magma ships
 * it to the agents, and its previews, which the stage at the top of the page
 * runs one at a time: its cases, the rules that are always true, the
 * situations of a block, in the order of the frontmatter. A candidate, a need Magma
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
        pattern.kind === 'design-language'
          ? !domains.has(pattern.id)
          : !groups.has(pattern.group ?? ''),
      );
      if (homeless.length)
        throw new Error(
          `magma ships ${homeless.map(({ id, kind, group }) => `${id} (${kind}${group ? `, group ${group}` : ''})`).join(', ')}, which have no place on the site: add a domain to DOMAINS in src/lib/nav.mjs with its UI string nav.design-language.<id>, a group to PATTERN_GROUPS with its UI strings nav.patterns.<group> and nav.blocks.<group>`,
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
        // The previews of the cases, then of the rules, then of the
        // situations, each in the order of its list.
        const previews = PREVIEWED.flatMap(({ of, key }) => {
          const items: string[] = (frontmatter[key] ?? []).map(
            (entry: { id?: string }) => entry.id,
          );
          return pattern.previews
            .filter((one) => items.includes(one.id))
            .sort((a, b) => items.indexOf(a.id) - items.indexOf(b.id))
            .map((one) => ({ ...one, of }));
        });
        const shown = new Set(previews.map((one) => one.id));
        const strays = pattern.previews.filter((one) => !shown.has(one.id));
        if (strays.length)
          throw new Error(
            `magma ships previews of ${pattern.id} for no case, rule or situation of it: ${strays.map((one) => one.id).join(', ')}`,
          );
        const { html, metadata } = await render(pageBody(pattern.body, sections));
        const data = await parseData({
          id: pattern.id,
          data: {
            kind: pattern.kind,
            group: pattern.group,
            status: pattern.status,
            title: pattern.title,
            need: String(frontmatter.need ?? '').trim(),
            principle: String(frontmatter.principle ?? '').trim(),
            html: linkPreviews(html, shown),
            headings: metadata?.headings ?? [],
            previews,
          },
        });
        store.set({ id: pattern.id, data, digest: generateDigest(data) });
      }
      const count = (kind: string) => shipped.filter((pattern) => pattern.kind === kind).length;
      logger.info(
        `Loaded from magma ${count('design-language')} domains of the design language, ${count('pattern')} patterns, ${count('block')} building blocks`,
      );
    },
  };
}
