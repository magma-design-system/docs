// The sections of the site (plan/CONTENT_STRUCTURE.md): the items of the rail.
// astro.config.mjs turns them into Starlight's sidebar, one top-level group per
// section and in this order; the frame (src/components/frame/) reads the group
// of the current page from Starlight and the icon from here. After the
// guidelines (Foundation, design language, building blocks, patterns) come the development
// sections (code, agents), then the library: components, tokens, icons and
// brand assets.
import {
  componentTags,
  componentTaxonomy,
  loadComponentDocs,
  loadDomains,
  loadPatterns,
} from './magma.mjs';
import { IDENTITY_GROUPS } from './identity.mjs';
import { sidebarLabel } from './i18n.mjs';

export const REPOSITORY = 'https://github.com/magma-design-system/magma';
/** The published Storybook, as the installed Magma gives it. */
export const STORYBOOK = loadComponentDocs().storybook;

/**
 * The domains of the design language, the rules of composition Magma ships as
 * files (`agents/patterns/<id>.md`, `kind: design-language`): the section Design
 * language, after Foundation. The order is the one of the domains in
 * https://github.com/magma-design-system/magma/issues/1189, rhythm and density
 * first, the two the patterns show the missing rules of most. `icon` is an
 * mds-icon slug, collected by iconsauce; the label is the UI string
 * `nav.design-language.<id>`. A domain the installed magma ships and this list
 * lacks fails the build (src/loaders/patterns.ts): add it here.
 */
export const DOMAINS = [
  { id: 'rhythm', icon: 'mi/outline/format-line-spacing' },
  { id: 'density', icon: 'mi/outline/density-medium' },
  { id: 'actions', icon: 'mi/outline/smart-button' },
  { id: 'titles', icon: 'mi/outline/title' },
  { id: 'surfaces', icon: 'mi/outline/layers' },
  { id: 'widths', icon: 'mi/outline/width-normal' },
];

/**
 * The domains the installed magma ships, in the order of DOMAINS: none before
 * the release that ships them.
 */
export function shippedDomains() {
  const shipped = new Set(loadDomains().map((domain) => domain.id));
  return DOMAINS.filter((domain) => shipped.has(domain.id));
}

/**
 * The groups of the patterns and of the building blocks, by the `group` of
 * their files, in the order of the section navigation and of the landing
 * pages, the frame of the page first, as in Magma's catalogue: the label is the UI string `nav.<section>.<id>` (`nav.patterns.data`,
 * `nav.blocks.data`), `icon` an mds-icon slug (collected by iconsauce), for
 * the heading of the group in the navigation (GROUP_ICONS) and for a card
 * with no preview. A pattern or a block of a group this list lacks fails the
 * build (src/loaders/patterns.ts), and so does a group without its UI string:
 * add them.
 */
export const PATTERN_GROUPS = [
  { id: 'navigation', icon: 'mi/outline/web' },
  { id: 'messages-and-states', icon: 'mi/outline/chat-bubble-outline' },
  { id: 'data', icon: 'mi/outline/table-rows' },
  { id: 'input', icon: 'mi/outline/edit-note' },
];

/** The section of the site of a kind of pattern, as the first segment of its address. */
export const PATTERN_SECTIONS = {
  'design-language': 'design-language',
  pattern: 'patterns',
  block: 'blocks',
};

/**
 * The patterns (`kind: pattern`) or the building blocks (`block`) the
 * installed magma ships, by group in the order of PATTERN_GROUPS, the groups
 * with none left out. In a group, the decided ones first, then the
 * candidates, each by title.
 * @param {'pattern' | 'block'} kind
 */
export function patternGroups(kind) {
  const shipped = loadPatterns().filter((pattern) => pattern.kind === kind);
  return PATTERN_GROUPS.map((group) => ({
    ...group,
    patterns: shipped
      .filter((pattern) => pattern.group === group.id)
      .sort(
        (a, b) =>
          Number(a.status === 'candidate') - Number(b.status === 'candidate') ||
          a.title.localeCompare(b.title),
      ),
  })).filter((group) => group.patterns.length > 0);
}

/**
 * The items of the section navigation of Patterns or Building blocks: the
 * landing page, then a group per topic, each pattern labelled by its title
 * as the package writes it, in English, as its page. The cards of the landing
 * page and the page itself say which ones are candidates.
 * @param {'pattern' | 'block'} kind
 */
function patternItems(kind) {
  const section = PATTERN_SECTIONS[kind];
  return [
    { slug: section, ...sidebarLabel('nav.overview') },
    ...patternGroups(kind).map((group) => ({
      ...sidebarLabel(`nav.${section}.${group.id}`),
      items: group.patterns.map((pattern) => ({
        label: pattern.title,
        link: `/${section}/${pattern.id}/`,
      })),
    })),
  ];
}

/**
 * `icon` is an mds-icon slug, collected by iconsauce (iconsauce.config.mjs).
 * `items` are Starlight sidebar items: the first one is where the rail item links.
 * A landing page titled like its section is labelled Overview in the section navigation.
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
    id: 'design-language',
    group: 'guidelines',
    icon: 'mi/outline/design-services',
    // The domains, generated from the installed magma
    // (src/pages/[...locale]/[section]/[id].astro), in the order of DOMAINS.
    items: () => [
      { slug: 'design-language', ...sidebarLabel('nav.overview') },
      ...shippedDomains().map(({ id }) => ({
        ...sidebarLabel(`nav.design-language.${id}`),
        link: `/design-language/${id}/`,
      })),
    ],
  },
  {
    id: 'blocks',
    group: 'guidelines',
    icon: 'mi/outline/extension',
    // Generated from the installed magma (src/pages/[...locale]/[section]/[id].astro).
    items: () => patternItems('block'),
  },
  {
    id: 'patterns',
    group: 'guidelines',
    icon: 'mi/outline/view-quilt',
    items: () => patternItems('pattern'),
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
  ...Object.fromEntries(
    ['patterns', 'blocks'].flatMap((section) =>
      PATTERN_GROUPS.map(({ id, icon }) => [`nav.${section}.${id}`, icon]),
    ),
  ),
  'nav.tokens.reference': 'mi/outline/list-alt',
  'nav.tokens.platforms': 'mi/outline/devices',
  'nav.tokens.tools': 'mi/outline/handyman',
  'nav.icons.guides': 'mi/outline/menu-book',
  'nav.icons.packages': 'mi/outline/inventory-2',
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
