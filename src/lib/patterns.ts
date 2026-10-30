// The patterns of the Patterns section and the blocks of the Building blocks
// section: one folder each in src/patterns/ or src/blocks/, with the same
// screen in each framework of FrameworkTabs: `example.html` (plain HTML; it is
// also the live preview, see src/pages/example/[kind]/[id].astro), `react.tsx`
// and `angular.ts`, which a sketch may not have yet. They are sample code for
// other projects, not code of this site: tsconfig.json leaves the framework
// ones out of the type check.
//
// Their pages are made like the pages of a component: an overview, then
// sub-pages listed in the "Documentation" column (DocsNav.astro), each a page
// of its own in src/content/docs/<kind>/<id>/.
import type { StarlightRouteData } from '@astrojs/starlight/route-data';
import { frameNav, localePrefix } from './frame';

const sources = import.meta.glob<string>('../{patterns,blocks}/*/*.{html,tsx,ts}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The section of a folder, as its folder in src/ and its path on the site. */
export type PatternKind = 'patterns' | 'blocks';
export const PATTERN_KINDS: PatternKind[] = ['patterns', 'blocks'];

/** What each file of a pattern folder is, and how the code block names it. */
const FILES = {
  vanilla: { file: 'example.html', lang: 'html' },
  react: { file: 'react.tsx', lang: 'tsx' },
  angular: { file: 'angular.ts', lang: 'ts' },
} as const;

export type PatternFramework = keyof typeof FILES;

const source = (kind: PatternKind, id: string, file: string) => sources[`../${kind}/${id}/${file}`];

/** Every pattern or block, by the name of its folder. */
export function patternIds(kind: PatternKind = 'patterns') {
  return [
    ...new Set(
      Object.keys(sources)
        .filter((path) => path.startsWith(`../${kind}/`))
        .map((path) => path.split('/')[2])
        .filter(Boolean),
    ),
  ].sort();
}

/**
 * The code of a pattern in each framework it has, with the language of its
 * code block: always the plain HTML one.
 */
export function patternCode(id: string, kind: PatternKind = 'patterns') {
  return Object.fromEntries(
    Object.entries(FILES).flatMap(([framework, { file, lang }]) => {
      const code = source(kind, id, file);
      return code === undefined ? [] : [[framework, { code: code.trimEnd(), lang }]];
    }),
  ) as Partial<Record<PatternFramework, { code: string; lang: string }>>;
}

/** The markup of the live preview: the plain HTML version. */
export function patternExample(id: string, kind: PatternKind = 'patterns') {
  const code = source(kind, id, FILES.vanilla.file);
  if (code === undefined) throw new Error(`No file src/${kind}/${id}/${FILES.vanilla.file}`);
  return code;
}

/** The address of the live preview, alone on a page; `query` sets it up (`case=2`). */
export function patternPreviewHref(id: string, kind: PatternKind = 'patterns', query = '') {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return `${base}example/${kind === 'blocks' ? 'block' : 'pattern'}/${id}/${query && `?${query}`}`;
}

/**
 * What the small preview of its card in the gallery shows, when it is not the
 * screen as it opens, by section and folder: a sketch with a demo panel shows
 * one of its cases, without the panel.
 */
const CARD_PREVIEW: Record<string, string> = { 'patterns/messages': 'case=3' };

export const cardPreviewQuery = (id: string, kind: PatternKind = 'patterns') =>
  CARD_PREVIEW[`${kind}/${id}`];

/**
 * The Magma components the plain HTML version uses, by tag, in alphabetical
 * order: the ones in its markup and the ones its script creates.
 */
export function patternComponents(id: string, kind: PatternKind = 'patterns') {
  const uses = patternExample(id, kind).matchAll(
    /<(mds-[a-z-]+)|createElement\(['"](mds-[a-z-]+)['"]\)/g,
  );
  return [...new Set([...uses].map(([, tag, created]) => tag ?? created))].sort();
}

export interface PatternPage {
  id: 'overview' | 'guidelines' | 'code' | 'mistakes';
  /** Last segment of the URL, `undefined` for the overview. */
  slug: string | undefined;
  /** Key of the UI dictionaries. */
  label:
    | 'component.page.overview'
    | 'pattern.page.guidelines'
    | 'pattern.page.code'
    | 'component.page.mistakes';
}

/**
 * The pages of a pattern or a block, in the order of the "Documentation"
 * column, as Overview, API, CSS, Examples and Mistakes for a component: the
 * overview (what it is for, the preview, when to use it, its anatomy and
 * components), the guidelines (behavior, accessibility, content), the code,
 * the mistakes. A page exists when its file does.
 */
export const patternPages: PatternPage[] = [
  { id: 'overview', slug: undefined, label: 'component.page.overview' },
  { id: 'guidelines', slug: 'guidelines', label: 'pattern.page.guidelines' },
  { id: 'code', slug: 'code', label: 'pattern.page.code' },
  { id: 'mistakes', slug: 'mistakes', label: 'component.page.mistakes' },
];

/** The id of a page in the docs collection: `it/patterns/list-with-filters/code`. */
export function patternEntryId(
  locale: string | undefined,
  kind: PatternKind,
  id: string,
  slug?: string,
) {
  return `${locale ? `${locale}/` : ''}${kind}/${id}${slug ? `/${slug}` : ''}`;
}

export function patternHref(
  locale: string | undefined,
  kind: PatternKind,
  id: string,
  slug?: string,
) {
  return `${localePrefix(locale)}/${kind}/${id}/${slug ? `${slug}/` : ''}`;
}

/** Section, folder and sub-page of a pattern or block page URL, `undefined` for any other page. */
export function parsePatternPath(pathname: string, locale: string | undefined) {
  for (const kind of PATTERN_KINDS) {
    const prefix = `${localePrefix(locale)}/${kind}/`;
    if (!pathname.startsWith(prefix)) continue;
    const [id, slug] = pathname.slice(prefix.length).split('/');
    if (!id || !patternIds(kind).includes(id)) return undefined;
    return { kind, id, slug: slug || undefined };
  }
  return undefined;
}

/** A topic of the gallery of a landing page, with its patterns or blocks. */
export interface GalleryGroup {
  /** The id of its heading, which the table of contents links to. */
  slug: string;
  label: string;
  items: { kind: PatternKind; id: string; href: string; label: string }[];
}

/** The id of a heading from its text, as Markdown makes it: `Messaggi e stati` -> `messaggi-e-stati`. */
const slugOf = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * The patterns or the blocks of the landing page of their section, by topic:
 * the groups of the section navigation (src/lib/nav.mjs), in its order, which
 * a production build leaves without the drafts. Empty on any other page. Read
 * by the gallery (PatternGallery.astro) and by the table of contents
 * (src/route-data.ts), which lists a heading for each group.
 */
export function galleryGroups(route: StarlightRouteData, pathname: string): GalleryGroup[] {
  const kind = PATTERN_KINDS.find((kind) => pathname === `${localePrefix(route.locale)}/${kind}/`);
  const { section } = frameNav(route, pathname);
  if (!kind || section?.id !== kind) return [];
  return section.group.entries.flatMap((entry) => {
    if (entry.type !== 'group') return [];
    const items = entry.entries.flatMap((link) => {
      if (link.type !== 'link') return [];
      const pattern = parsePatternPath(link.href, route.locale);
      return pattern ? [{ ...pattern, href: link.href, label: link.label }] : [];
    });
    return items.length > 0 ? [{ slug: slugOf(entry.label), label: entry.label, items }] : [];
  });
}
