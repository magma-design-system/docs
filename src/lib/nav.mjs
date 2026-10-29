// The sections of the site (plan/CONTENT_STRUCTURE.md): the items of the rail.
// astro.config.mjs turns them into Starlight's sidebar, one top-level group per
// section and in this order; the frame (src/components/frame/) reads the group
// of the current page from Starlight and the icon from here. After the
// guidelines (Foundation, building blocks, patterns) come the development
// sections (code, agents), then the library: components, tokens, icons and
// brand assets.
import { existsSync, readFileSync } from 'node:fs';
import { componentTags, componentTaxonomy, loadComponentDocs } from './magma.mjs';
import { IDENTITY_GROUPS } from './identity.mjs';
import { sidebarLabel } from './i18n.mjs';

export const REPOSITORY = 'https://github.com/magma-design-system/magma';
/** The published Storybook, as the installed Magma gives it. */
export const STORYBOOK = loadComponentDocs().storybook;

/**
 * `icon` is an mds-icon slug, collected by iconsauce (iconsauce.config.mjs).
 * `items` are Starlight sidebar items: the first one is where the rail item links.
 * A landing page titled like its section is labelled Overview in the section navigation.
 * `soon`: a section still being written, whose landing page says what is coming
 * (its pages are drafts, see `published`).
 * `group`: the group of the rail the section is listed under, labelled
 * `frame.sections.<group>`: the guidelines written here, the development of a
 * product with Magma, the library that comes from the packages. The sections
 * of a group follow each other; Community stands alone, at the end.
 * `railLabel`: the UI string that names the section in the open rail and in
 * the menu, under the label of its group, when its own name repeats it
 * (Development > Code); the collapsed rail keeps the name of the section.
 * `rail: false`: a section with no item in the rail and in the menu: Home,
 * which the logo and the name of the site above them link to (Brand.astro).
 */
export const sections = [
  {
    id: 'home',
    icon: 'mi/outline/home',
    rail: false,
    // The home page has no section navigation (`template: splash`); the
    // Changelog has, with the home page as Overview.
    items: () => [{ slug: 'index', ...sidebarLabel('nav.overview') }, { slug: 'changelog' }],
  },
  {
    id: 'foundation',
    group: 'guidelines',
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
    id: 'blocks',
    group: 'guidelines',
    icon: 'mi/outline/extension',
    soon: true,
    // Each block with a small preview of it (SectionEntries.astro). Its
    // sub-pages are listed in the "Documentation" column (src/lib/patterns.ts).
    items: () =>
      published([
        { slug: 'blocks', ...sidebarLabel('nav.overview') },
        { slug: 'blocks/page-header' },
      ]),
  },
  {
    id: 'patterns',
    group: 'guidelines',
    icon: 'mi/outline/view-quilt',
    soon: true,
    // The groups of the landing page, in its order. Each pattern with a small
    // preview of it (SectionEntries.astro); its sub-pages are listed in the
    // "Documentation" column (src/lib/patterns.ts).
    items: () =>
      published([
        { slug: 'patterns', ...sidebarLabel('nav.overview') },
        {
          ...sidebarLabel('nav.patterns.messages'),
          items: [{ slug: 'patterns/messages' }],
        },
        {
          ...sidebarLabel('nav.patterns.data'),
          items: [{ slug: 'patterns/list-with-filters' }, { slug: 'patterns/record-detail' }],
        },
      ]),
  },
  {
    id: 'development',
    group: 'development',
    railLabel: 'frame.sections.development.code',
    icon: 'mi/outline/code',
    items: () => [
      { slug: 'development', ...sidebarLabel('nav.overview') },
      {
        ...sidebarLabel('nav.development.guides'),
        items: [
          { slug: 'development/installation' },
          { slug: 'development/lint' },
          { slug: 'development/versions' },
        ],
      },
    ],
  },
  {
    id: 'ai',
    group: 'development',
    railLabel: 'frame.sections.development.agentic',
    icon: 'mi/outline/auto-awesome',
    // The groups of the landing page, in its order.
    items: () => [
      { slug: 'ai', ...sidebarLabel('nav.overview') },
      {
        ...sidebarLabel('nav.ai.start'),
        items: [{ slug: 'ai/start-a-project' }, { slug: 'ai/working-with-agents' }],
      },
      {
        ...sidebarLabel('nav.ai.tools'),
        items: [{ slug: 'ai/guides' }, { slug: 'ai/mcp-server' }, { slug: 'ai/claude-code' }],
      },
    ],
  },
  {
    id: 'components',
    group: 'library',
    icon: 'mi/outline/widgets',
    items: () => [
      { ...sidebarLabel('nav.components.overview'), link: '/components/' },
      ...componentItems(),
    ],
  },
  {
    id: 'tokens',
    group: 'library',
    icon: 'mi/outline/palette',
    items: () => [
      { slug: 'tokens', ...sidebarLabel('nav.overview') },
      // The groups of the landing page, in its order.
      {
        ...sidebarLabel('nav.tokens.reference'),
        items: [
          { slug: 'tokens/color' },
          { slug: 'tokens/typography' },
          { slug: 'tokens/space-and-layout' },
          { slug: 'tokens/shape-and-depth' },
          { slug: 'tokens/motion' },
          { slug: 'tokens/themes-and-preferences' },
        ],
      },
      {
        ...sidebarLabel('nav.tokens.platforms'),
        items: [
          { slug: 'tokens/web' },
          { slug: 'tokens/android' },
          { slug: 'tokens/ios' },
          { slug: 'tokens/flutter' },
        ],
      },
      {
        ...sidebarLabel('nav.tokens.tools'),
        items: [{ slug: 'tokens/tailwind' }, { slug: 'tokens/figma' }],
      },
    ],
  },
  {
    id: 'icons',
    group: 'library',
    icon: 'mi/outline/brush',
    // The guides, then the packages, as on the landing page.
    items: () => [
      { slug: 'icons', ...sidebarLabel('nav.overview') },
      {
        ...sidebarLabel('nav.icons.guides'),
        items: [{ slug: 'icons/using-icons' }, { slug: 'icons/iconsauce' }],
      },
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
    id: 'brand',
    group: 'library',
    icon: 'mi/outline/design-services',
    items: () => [
      { slug: 'brand', ...sidebarLabel('nav.overview') },
      // The groups of the landing page, in its order.
      {
        ...sidebarLabel('nav.brand.assets'),
        // Pages generated per folder of the identity package (src/lib/identity.mjs).
        items: IDENTITY_GROUPS.map(({ page }) => ({
          ...sidebarLabel(`brand.page.${page}.title`),
          link: `/brand/${page}/`,
        })),
      },
      {
        ...sidebarLabel('nav.brand.package'),
        items: [{ slug: 'brand/identity-package' }],
      },
    ],
  },
  {
    id: 'community',
    icon: 'mi/outline/forum',
    items: () => [
      { slug: 'community' },
      // The groups of the landing page, in its order.
      {
        ...sidebarLabel('nav.community.participate'),
        items: [{ slug: 'community/contributing' }, { slug: 'community/code-of-conduct' }],
      },
      {
        ...sidebarLabel('nav.community.about'),
        items: [{ slug: 'community/media-kit' }, { slug: 'community/about' }],
      },
    ],
  },
];

/**
 * The icon of each group of the rail, drawn before its label. The sections of
 * a group have none in the open rail and in the menu: the icon of a section
 * shows only in the collapsed rail, which has no labels, and on the sections
 * that stand alone (Home, Community).
 */
export const RAIL_GROUP_ICONS = {
  guidelines: 'mi/outline/menu-book',
  development: 'mi/outline/code',
  library: 'mi/outline/category',
};

/**
 * The categories of the components (`@category` in documentation.json, since
 * Magma 2.6.0), in the order of the section navigation, each labelled
 * `nav.components.<id>`.
 */
export const COMPONENT_CATEGORIES = [
  'actions',
  'forms',
  'navigation',
  'feedback',
  'overlays',
  'data',
  'tags',
  'structure',
  'content',
  'preferences',
];

/**
 * The component pages of the section navigation: a group per category, with
 * the components that stand alone; their parts (`@parent`) are listed in the
 * right column of their pages (DocsNav.astro). A flat list of every tag when a
 * component has neither a category of the list nor a parent, rather than a
 * page missing from the navigation: a category Magma adds needs its entry here.
 */
function componentItems() {
  const tags = componentTags();
  const { categories, parents } = componentTaxonomy();
  /** @param {string} tag */
  const link = (tag) => ({ label: componentName(tag), link: `/components/${tag}/` });
  const sorted = tags.every(
    (tag) => parents.has(tag) || COMPONENT_CATEGORIES.includes(categories.get(tag) ?? ''),
  );
  if (!sorted) return tags.map(link);
  return COMPONENT_CATEGORIES.map((id) => ({
    ...sidebarLabel(`nav.components.${id}`),
    items: tags.filter((tag) => !parents.has(tag) && categories.get(tag) === id).map(link),
  }));
}

/**
 * The icon of each group of a section navigation, drawn above its label
 * (src/components/frame/SectionEntries.astro), by the UI string of the label:
 * Starlight's schema of a group has no room for it, and `items()` cannot run
 * once bundled (it reads the dictionaries from src/).
 */
export const GROUP_ICONS = {
  'nav.foundation.base': 'mi/outline/foundation',
  'nav.foundation.design': 'mi/outline/style',
  'nav.foundation.content': 'mi/outline/record-voice-over',
  'nav.tokens.reference': 'mi/outline/list-alt',
  'nav.tokens.platforms': 'mi/outline/devices',
  'nav.tokens.tools': 'mi/outline/handyman',
  'nav.icons.guides': 'mi/outline/menu-book',
  'nav.icons.packages': 'mi/outline/inventory-2',
  'nav.patterns.messages': 'mi/outline/notifications',
  'nav.patterns.data': 'mi/outline/table-chart',
  'nav.brand.assets': 'mi/outline/collections',
  'nav.brand.package': 'mi/outline/inventory-2',
  'nav.development.guides': 'mi/outline/menu-book',
  'nav.ai.start': 'mi/outline/rocket-launch',
  'nav.ai.tools': 'mi/outline/handyman',
  'nav.community.participate': 'mi/outline/handshake',
  'nav.community.about': 'mi/outline/info',
  'nav.components.actions': 'mdi/button-pointer',
  'nav.components.forms': 'mdi/form-textbox',
  'nav.components.navigation': 'mi/outline/explore',
  'nav.components.feedback': 'mi/outline/notifications',
  'nav.components.overlays': 'mi/outline/picture-in-picture',
  'nav.components.data': 'mi/outline/table-chart',
  'nav.components.tags': 'mi/outline/sell',
  'nav.components.structure': 'mi/outline/dashboard',
  'nav.components.content': 'mi/outline/article',
  'nav.components.preferences': 'mi/outline/tune',
};

/**
 * Whether the page of a sidebar slug is a draft (`draft: true` in its front
 * matter), a file or the index of a folder (the overview of a pattern, with
 * its sub-pages around it). Read on use, from astro.config.mjs: once bundled,
 * `import.meta.url` no longer points at src/ (as in i18n.mjs).
 * @param {string} slug
 */
function isDraft(slug) {
  for (const path of [slug, `${slug}/index`].flatMap((path) => [`${path}.mdx`, `${path}.md`])) {
    const file = new URL(`../content/docs/${path}`, import.meta.url);
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
