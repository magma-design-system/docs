// The pages of what Magma ships in agents/patterns/: the domains of the design
// language under Foundation, the patterns and the building blocks, each page
// with the previews of its cases, rules or situations (src/loaders/patterns.ts
// gives the data): their addresses, and the pattern of an address.
import { localePrefix } from './frame';
import { loadPatterns, type MagmaPattern } from './magma.mjs';
import { PATTERN_SECTIONS } from './nav.mjs';

export type PatternKind = MagmaPattern['kind'];

const KINDS = new Map(loadPatterns().map(({ id, kind }) => [id, kind]));

/** The id of the heading of the group Composition on the landing page of Foundation. */
export const COMPOSITION = 'composition';

/** The page of a domain, a pattern or a building block. */
export function patternHref(locale: string | undefined, kind: PatternKind, id: string): string {
  return `${localePrefix(locale)}/${PATTERN_SECTIONS[kind]}/${id}/`;
}

/**
 * The page that runs a preview of a case, a rule or a situation, in an iframe:
 * /docs/example/<domain, pattern or block>/<id>/<preview>/.
 */
export function previewHref(kind: PatternKind, id: string, preview: string): string {
  const segment = kind === 'foundation' ? 'domain' : kind;
  return `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}example/${segment}/${id}/${preview}/`;
}

/** The pattern of a page URL, `undefined` for any other page. */
export function parsePatternPath(
  pathname: string,
  locale: string | undefined,
): { kind: PatternKind; id: string } | undefined {
  for (const [kind, section] of Object.entries(PATTERN_SECTIONS) as [PatternKind, string][]) {
    const prefix = `${localePrefix(locale)}/${section}/`;
    if (!pathname.startsWith(prefix)) continue;
    const [id, rest] = pathname.slice(prefix.length).split('/');
    if (id && !rest && KINDS.get(id) === kind) return { kind, id };
  }
  return undefined;
}
