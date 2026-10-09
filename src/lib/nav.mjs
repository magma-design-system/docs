// The 8 sections of the site (plan/CONTENT_STRUCTURE.md): the items of the rail.
// astro.config.mjs turns them into Starlight's sidebar, one top-level group per
// section and in this order; the frame (src/components/frame/) reads the group
// of the current page from Starlight and the icon from here.
import { componentTags } from './magma.mjs';
import { sidebarLabel } from './i18n.mjs';

export const REPOSITORY = 'https://github.com/magma-design-system/magma';

/**
 * `icon` is an mds-icon slug, collected by iconsauce (iconsauce.config.mjs).
 * `items` are Starlight sidebar items: the first one is where the rail item links.
 */
export const sections = [
  {
    id: 'introduction',
    icon: 'mi/outline/home',
    items: () => [{ slug: 'index' }, { slug: 'about' }],
  },
  {
    id: 'foundation',
    icon: 'mi/outline/account-balance',
    items: () => [{ slug: 'foundation' }],
  },
  {
    id: 'tokens',
    icon: 'mi/outline/palette',
    items: () => [{ slug: 'tokens' }],
  },
  {
    id: 'icons',
    icon: 'mi/outline/brush',
    items: () => [{ slug: 'icons' }],
  },
  {
    id: 'components',
    icon: 'mi/outline/widgets',
    items: () => [
      { ...sidebarLabel('nav.components.overview'), link: '/components/' },
      ...componentTags().map((tag) => ({ label: componentName(tag), link: `/components/${tag}/` })),
    ],
  },
  {
    id: 'brand',
    icon: 'mi/outline/design-services',
    items: () => [{ slug: 'brand' }],
  },
  {
    id: 'development',
    icon: 'mi/outline/code',
    items: () => [{ slug: 'development' }],
  },
  {
    id: 'community',
    icon: 'mi/outline/forum',
    items: () => [{ slug: 'community' }],
  },
];

/** Starlight's `sidebar` config: one group per section, labelled from the UI dictionaries. */
export function sidebar() {
  return sections.map((section) => ({
    ...sidebarLabel(`nav.${section.id}`),
    items: section.items(),
  }));
}

/**
 * Readable name of a component, for navigation: `mds-accordion-timer` -> `Accordion timer`.
 * @param {string} tag
 */
export function componentName(tag) {
  const words = tag.replace(/^mds-/, '').replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
