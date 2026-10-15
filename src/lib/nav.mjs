// The 9 sections of the site (plan/CONTENT_STRUCTURE.md): the items of the rail.
// astro.config.mjs turns them into Starlight's sidebar, one top-level group per
// section and in this order; the frame (src/components/frame/) reads the group
// of the current page from Starlight and the icon from here.
import { componentTags } from './magma.mjs';
import { IDENTITY_GROUPS } from './identity.mjs';
import { sidebarLabel } from './i18n.mjs';

export const REPOSITORY = 'https://github.com/magma-design-system/magma';
export const STORYBOOK = 'https://magma-design-system.github.io/magma/storybook/';

/**
 * `icon` is an mds-icon slug, collected by iconsauce (iconsauce.config.mjs).
 * `items` are Starlight sidebar items: the first one is where the rail item links.
 * A landing page titled like its section is labelled Overview in the section navigation.
 */
export const sections = [
  {
    id: 'home',
    icon: 'mi/outline/home',
    // One page, without the section navigation (`template: splash`).
    items: () => [{ slug: 'index', ...sidebarLabel('nav.overview') }],
  },
  {
    id: 'foundation',
    icon: 'mi/outline/account-balance',
    // The groups of the landing page, in its order.
    items: () => [
      { slug: 'foundation', ...sidebarLabel('nav.overview') },
      {
        ...sidebarLabel('nav.foundation.base'),
        items: [{ slug: 'foundation/principles' }, { slug: 'foundation/accessibility' }],
      },
      {
        ...sidebarLabel('nav.foundation.design'),
        items: [
          { slug: 'foundation/color' },
          { slug: 'foundation/typography' },
          { slug: 'foundation/illustration' },
        ],
      },
      {
        ...sidebarLabel('nav.foundation.content'),
        items: [{ slug: 'foundation/voice-and-tone' }, { slug: 'foundation/inclusive-language' }],
      },
    ],
  },
  {
    id: 'tokens',
    icon: 'mi/outline/palette',
    items: () => [
      { slug: 'tokens', ...sidebarLabel('nav.overview') },
      { slug: 'tokens/color' },
      { slug: 'tokens/typography' },
      { slug: 'tokens/space-and-layout' },
      { slug: 'tokens/shape-and-depth' },
      { slug: 'tokens/motion' },
      { slug: 'tokens/themes-and-preferences' },
      { slug: 'tokens/tailwind' },
      { slug: 'tokens/figma' },
    ],
  },
  {
    id: 'icons',
    icon: 'mi/outline/brush',
    items: () => [
      { slug: 'icons' },
      // Pages generated per set and category (src/lib/icon-pages.ts).
      { ...sidebarLabel('icons.page.mgg.title'), link: '/icons/maggioli/' },
      { ...sidebarLabel('icons.page.mi.title'), link: '/icons/material-icons/' },
      { ...sidebarLabel('icons.page.mdi.title'), link: '/icons/material-design-icons/' },
      { slug: 'icons/using-icons' },
      { slug: 'icons/iconsauce' },
      { slug: 'icons/icons-package' },
    ],
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
    id: 'patterns',
    icon: 'mi/outline/view-quilt',
    // The groups of the landing page, in its order.
    items: () => [
      { slug: 'patterns', ...sidebarLabel('nav.overview') },
      {
        ...sidebarLabel('nav.patterns.data'),
        items: [{ slug: 'patterns/list-with-filters' }, { slug: 'patterns/record-detail' }],
      },
    ],
  },
  {
    id: 'brand',
    icon: 'mi/outline/design-services',
    items: () => [
      { slug: 'brand', ...sidebarLabel('nav.overview') },
      // Pages generated per folder of the identity package (src/lib/identity.mjs).
      ...IDENTITY_GROUPS.map(({ page }) => ({
        ...sidebarLabel(`brand.page.${page}.title`),
        link: `/brand/${page}/`,
      })),
      { slug: 'brand/identity-package' },
    ],
  },
  {
    id: 'development',
    icon: 'mi/outline/code',
    items: () => [
      { slug: 'development', ...sidebarLabel('nav.overview') },
      { slug: 'development/installation' },
      { slug: 'development/agentic-development' },
      { slug: 'development/versions' },
    ],
  },
  {
    id: 'community',
    icon: 'mi/outline/forum',
    items: () => [
      { slug: 'community' },
      { slug: 'community/contributing' },
      { slug: 'community/code-of-conduct' },
      { slug: 'community/about' },
    ],
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
