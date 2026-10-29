// What the frame shows, read from Starlight's sidebar of the current page: the
// rail (one item per section, in the groups of src/lib/nav.mjs) and the section
// navigation.
import type { StarlightRouteData } from '@astrojs/starlight/route-data';
import { componentRoot } from './magma.mjs';
import { RAIL_GROUP_ICONS, sections as sectionConfig } from './nav.mjs';

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
  /** UI string of its name under the label of its group, when it has one of its own. */
  railLabel?: string;
}

/** Sections that follow each other in the rail, under the label of their group. */
export interface FrameSectionGroup {
  /** `frame.sections.<id>`; none for a section that stands alone. */
  id?: string;
  /** Drawn before the label, in place of the icons of its sections. */
  icon?: string;
  sections: FrameSection[];
}

export interface FrameNav {
  sections: FrameSection[];
  /** The sections as the rail lists them, without those it leaves to the brand (Home). */
  groups: FrameSectionGroup[];
  /** Section of the current page. */
  section?: FrameSection;
  /** Sidebar link of the current page, or of the page it belongs to (component sub-pages). */
  currentHref?: string;
}

const links = (entries: SidebarEntry[]): SidebarLink[] =>
  entries.flatMap((entry) => (entry.type === 'link' ? [entry] : links(entry.entries)));

/**
 * The path a page has in the navigation: a part of a compound component
 * (`@parent`), which the navigation leaves out, belongs to its component.
 */
function navPath(pathname: string): string {
  const tag = pathname.match(/\/components\/(mds-[a-z0-9-]+)\//)?.[1];
  if (!tag) return pathname;
  return pathname.replace(`/components/${tag}/`, `/components/${componentRoot(tag)}/`);
}

export function frameNav(route: StarlightRouteData, pathname: string): FrameNav {
  const groups = route.sidebar.filter((entry): entry is SidebarGroup => entry.type === 'group');
  if (groups.length !== sectionConfig.length) {
    throw new Error(
      `Expected one sidebar group per section of src/lib/nav.mjs, got ${groups.length}`,
    );
  }

  // The page itself, or else the longest link the path starts with:
  // /components/mds-button/api/ belongs to /components/mds-button/. Every path
  // starts with the home page, which only matches itself (not a 404 page).
  const home = `${localePrefix(route.locale)}/`;
  const all = links(groups);
  const path = navPath(pathname);
  const current =
    all.find((link) => link.isCurrent) ??
    all
      .filter((link) => link.href !== home && path.startsWith(link.href))
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
      railLabel: sectionConfig[i].railLabel,
    };
  });

  const railGroups: FrameSectionGroup[] = [];
  sections.forEach((section, i) => {
    if (sectionConfig[i].rail === false) return;
    const id = sectionConfig[i].group;
    const last = railGroups.at(-1);
    if (id && last?.id === id) last.sections.push(section);
    else
      railGroups.push({
        id,
        icon: id ? RAIL_GROUP_ICONS[id as keyof typeof RAIL_GROUP_ICONS] : undefined,
        sections: [section],
      });
  });

  return {
    sections,
    groups: railGroups,
    section: sections.find((s) => s.current),
    currentHref: current?.href,
  };
}

/** Site path of a locale: `''` for the root locale, `'/it'` for Italian. */
export function localePrefix(locale: string | undefined): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${locale ? `/${locale}` : ''}`;
}
