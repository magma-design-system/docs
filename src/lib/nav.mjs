// The sections of the site (plan/CONTENT_STRUCTURE.md): the items of the rail.
// astro.config.mjs turns them into Starlight's sidebar, one top-level group per
// section and in this order; the frame (src/components/frame/) reads the group
// of the current page from Starlight and the icon from here.
import { existsSync, readFileSync } from 'node:fs';
import { componentTags } from './magma.mjs';
import { IDENTITY_GROUPS } from './identity.mjs';
import { sidebarLabel } from './i18n.mjs';

export const REPOSITORY = 'https://github.com/magma-design-system/magma';
export const STORYBOOK = 'https://magma-design-system.github.io/magma/storybook/';

/**
 * `icon` is an mds-icon slug, collected by iconsauce (iconsauce.config.mjs).
 * `items` are Starlight sidebar items: the first one is where the rail item links.
 * A landing page titled like its section is labelled Overview in the section navigation.
 * `soon`: a section still being written, whose landing page says what is coming
 * (its pages are drafts, see `published`).
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
    // The guides, then the packages, as on the landing page.
    items: () => [
      { slug: 'icons', ...sidebarLabel('nav.overview') },
      { slug: 'icons/using-icons' },
      { slug: 'icons/iconsauce' },
      {
        ...sidebarLabel('nav.icons.packages'),
        items: [
          // Pages generated per set and category (src/lib/icon-pages.ts).
          { ...sidebarLabel('icons.page.mgg.title'), link: '/icons/maggioli/' },
          { ...sidebarLabel('icons.page.mi.title'), link: '/icons/material-icons/' },
          { ...sidebarLabel('icons.page.mdi.title'), link: '/icons/material-design-icons/' },
          { slug: 'icons/icons-package' },
        ],
      },
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
    id: 'blocks',
    icon: 'mi/outline/extension',
    soon: true,
    items: () => [{ slug: 'blocks', ...sidebarLabel('nav.overview') }],
  },
  {
    id: 'patterns',
    icon: 'mi/outline/view-quilt',
    soon: true,
    // The groups of the landing page, in its order.
    items: () =>
      published([
        { slug: 'patterns', ...sidebarLabel('nav.overview') },
        {
          ...sidebarLabel('nav.patterns.data'),
          items: [{ slug: 'patterns/list-with-filters' }, { slug: 'patterns/record-detail' }],
        },
      ]),
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
      { slug: 'community/media-kit' },
      { slug: 'community/about' },
    ],
  },
];

/**
 * Whether the page of a sidebar slug is a draft (`draft: true` in its front
 * matter). Read on use, from astro.config.mjs: once bundled, `import.meta.url`
 * no longer points at src/ (as in i18n.mjs).
 * @param {string} slug
 */
function isDraft(slug) {
  for (const extension of ['mdx', 'md']) {
    const file = new URL(`../content/docs/${slug}.${extension}`, import.meta.url);
    if (!existsSync(file)) continue;
    const frontMatter = readFileSync(file, 'utf8').split(/^---$/m)[1] ?? '';
    return /^draft:\s*true\s*$/m.test(frontMatter);
  }
  return false;
}

/**
 * Sidebar items without the draft pages in a production build, where Starlight
 * leaves them out (a slug to a page that is not built is an error), and without
 * the groups left empty. In dev the drafts stay, to be written and reviewed.
 * @param {any[]} items
 * @returns {any[]}
 */
function published(items) {
  if (process.env.NODE_ENV !== 'production') return items;
  return items.flatMap((item) => {
    if (item.slug) return isDraft(item.slug) ? [] : [item];
    if (!item.items) return [item];
    const kept = published(item.items);
    return kept.length > 0 ? [{ ...item, items: kept }] : [];
  });
}

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
