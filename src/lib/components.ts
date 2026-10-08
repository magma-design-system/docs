// Sub-pages of a component page, listed in the "Documentation" column of the
// frame (plan/CONTENT_STRUCTURE.md, layout decision 4). A sub-page exists only
// when documentation.json has its data: Anatomy, Features and Installation have
// no source yet and are left out until they do.
import type { CollectionEntry } from 'astro:content';
import { localePrefix } from './frame';

type ComponentData = CollectionEntry<'components'>['data'];

export interface ComponentPage {
  id: 'overview' | 'api' | 'css' | 'guidelines';
  /** Last segment of the URL, `undefined` for the component's main page. */
  slug: string | undefined;
  /** Key of the UI dictionaries. */
  label: 'component.page.overview' | 'component.page.api' | 'component.page.css' | 'component.page.guidelines';
  has: (data: ComponentData) => boolean;
}

export const componentPages: ComponentPage[] = [
  { id: 'overview', slug: undefined, label: 'component.page.overview', has: () => true },
  {
    id: 'api',
    slug: 'api',
    label: 'component.page.api',
    has: (d) => d.props.length + d.events.length + d.methods.length + d.slots.length > 0,
  },
  { id: 'css', slug: 'css', label: 'component.page.css', has: (d) => d.styles.length + d.parts.length > 0 },
  { id: 'guidelines', slug: 'guidelines', label: 'component.page.guidelines', has: (d) => d.usage.length > 0 },
];

export const pagesOf = (data: ComponentData) => componentPages.filter((page) => page.has(data));

export function componentHref(locale: string | undefined, tag: string, slug?: string): string {
  return `${localePrefix(locale)}/components/${tag}/${slug ? `${slug}/` : ''}`;
}

/** Tag and sub-page of a component page URL, `undefined` for any other page. */
export function parseComponentPath(pathname: string, locale: string | undefined) {
  const prefix = `${localePrefix(locale)}/components/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const [tag, slug] = pathname.slice(prefix.length).split('/');
  if (!tag?.startsWith('mds-')) return undefined;
  return { tag, slug: slug || undefined };
}
