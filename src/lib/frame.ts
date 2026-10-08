// What the frame shows, read from Starlight's sidebar of the current page: the
// rail (one item per section, src/lib/nav.mjs) and the section navigation.
import type { StarlightRouteData } from '@astrojs/starlight/route-data';
import { sections as sectionConfig } from './nav.mjs';

type SidebarEntry = StarlightRouteData['sidebar'][number];
export type SidebarLink = Extract<SidebarEntry, { type: 'link' }>;
export type SidebarGroup = Extract<SidebarEntry, { type: 'group' }>;

export interface FrameSection {
  id: string;
  label: string;
  icon: string;
  /** First page of the section, where the rail item links. */
  href: string;
  current: boolean;
  group: SidebarGroup;
}

export interface FrameNav {
  sections: FrameSection[];
  /** Section of the current page. */
  section?: FrameSection;
  /** Sidebar link of the current page, or of the page it belongs to (component sub-pages). */
  currentHref?: string;
}

const links = (entries: SidebarEntry[]): SidebarLink[] =>
  entries.flatMap((entry) => (entry.type === 'link' ? [entry] : links(entry.entries)));

export function frameNav(route: StarlightRouteData, pathname: string): FrameNav {
  const groups = route.sidebar.filter((entry): entry is SidebarGroup => entry.type === 'group');
  if (groups.length !== sectionConfig.length) {
    throw new Error(`Expected one sidebar group per section of src/lib/nav.mjs, got ${groups.length}`);
  }

  // The page itself, or else the longest link the path starts with:
  // /components/mds-button/api/ belongs to /components/mds-button/. Every path
  // starts with the home page, which only matches itself (not a 404 page).
  const home = `${localePrefix(route.locale)}/`;
  const all = links(groups);
  const current =
    all.find((link) => link.isCurrent) ??
    all
      .filter((link) => link.href !== home && pathname.startsWith(link.href))
      .sort((a, b) => b.href.length - a.href.length)[0];

  const sections = groups.map((group, i) => {
    const groupLinks = links(group.entries);
    return {
      id: sectionConfig[i].id,
      label: group.label,
      icon: sectionConfig[i].icon,
      href: groupLinks[0]?.href ?? '',
      current: current !== undefined && groupLinks.includes(current),
      group,
    };
  });

  return { sections, section: sections.find((s) => s.current), currentHref: current?.href };
}

/** Site path of a locale: `''` for the root locale, `'/it'` for Italian. */
export function localePrefix(locale: string | undefined): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${locale ? `/${locale}` : ''}`;
}
