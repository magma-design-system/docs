// The pages of the icon sets (src/pages/[...locale]/icons/[set]/[...category].astro):
// the page of a set shows its first category, every other category has a page
// of its own, /icons/<set page>/<category>/, listed in the "Categories" column
// of the frame (DocsNav.astro), as the sub-pages of a component are.
import { localePrefix } from './frame';
import { ICON_SETS, iconSet, type IconSetId } from './icons.mjs';

/** The last segment of the URL of each set. */
export const ICON_SET_PAGES: Record<IconSetId, string> = {
  mgg: 'maggioli',
  mi: 'material-icons',
  mdi: 'material-design-icons',
};

/** The URL of a category of a set; the first category is the page of the set. */
export function iconCategoryHref(
  locale: string | undefined,
  set: IconSetId,
  category?: string,
): string {
  const first = iconSet(set).categories[0]?.id;
  const segment = category && category !== first ? `${category}/` : '';
  return `${localePrefix(locale)}/icons/${ICON_SET_PAGES[set]}/${segment}`;
}

/** Set and category of the page of an icon set, `undefined` for any other page. */
export function parseIconSetPath(pathname: string, locale: string | undefined) {
  const prefix = `${localePrefix(locale)}/icons/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const [page, category] = pathname.slice(prefix.length).split('/');
  const set = ICON_SETS.find((id) => ICON_SET_PAGES[id] === page);
  if (!set) return undefined;
  const { categories } = iconSet(set);
  return { set, category: category || categories[0]?.id, categories };
}
