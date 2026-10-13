// The icons of the Icons section, read from node_modules like every Magma file
// of the site (src/lib/magma.mjs):
// - the three sets iconsauce serves (Maggioli, Material Icons, Material Design
//   Icons), with the categories and the tags their packages publish, for the
//   page of each set;
// - the dictionary of the legacy icons package (@maggioli-design-system/icons)
//   and, for each of its names, the iconsauce slug that draws the same icon.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolveMagma } from './magma.mjs';

const require = createRequire(import.meta.url);

/** The sets, in the order of the section navigation. */
export const ICON_SETS = /** @type {const} */ (['mgg', 'mi', 'mdi']);

/** @typedef {(typeof ICON_SETS)[number]} IconSetId */

/** The styles of Material Icons, as iconsauce names them; the first one is the default. */
export const MATERIAL_STYLES = ['baseline', 'outline', 'round', 'sharp'];

/**
 * The slug of an icon of a set.
 * @param {IconSetId} set
 * @param {string} name
 * @param {string} [style] Material Icons only
 */
export const slugOf = (set, name, style = MATERIAL_STYLES[0]) =>
  set === 'mi' ? `mi/${style}/${name}` : `${set}/${name}`;

/**
 * Where the dictionary takes each icon from (`<source>/<file>`) and the
 * iconsauce slug of that file: Google's filled Material Icons are
 * `mi/baseline/`, with dashes for underscores as iconsauce names them.
 */
const SOURCES = {
  material: (/** @type {string} */ file) => `mi/baseline/${file.replaceAll('_', '-')}`,
  'material-icons-svg': (/** @type {string} */ file) => `mi/baseline/${file.replaceAll('_', '-')}`,
  mdi: (/** @type {string} */ file) => `mdi/${file}`,
  maggioli: (/** @type {string} */ file) => `mgg/${file}`,
};

/**
 * Names whose Material icon Google has redrawn since the icons package was
 * built: the old drawing lives on, identical, under another slug. Checked
 * pixel by pixel against icons 1.94.0 (October 2026). data-analytics and
 * data-bar-chart have no identical drawing left: they keep the current
 * mi/baseline/bar-chart.
 */
const SAME_DRAWING = {
  'avatar-placeholder-user': 'mdi/account-circle',
  'cards-view': 'mdi/view-module',
  'columns-view': 'mdi/view-column',
  'design-palette': 'mi/baseline/color-lens',
  'view-comfy': 'mdi/view-comfy',
};

/**
 * @typedef {object} LegacyIcon
 * @property {string} name name in the dictionary, and of the SVG file
 * @property {string} className class of the icon font
 * @property {string} member member of the `MggIcons` TypeScript enum
 * @property {string} slug iconsauce slug of the same icon
 * @property {IconSetId} set the set of the slug
 */

/** @type {LegacyIcon[] | undefined} */
let legacy;

/**
 * Every icon of the icons package, in the order of its dictionary.
 * @returns {LegacyIcon[]}
 */
export function legacyIcons() {
  if (legacy) return legacy;
  /** @type {Record<string, string>} */
  const dictionary = require(resolveMagma('icons/dist/dictionary.json'));
  // `ActionCopy = "mgg-icons-action-copy",`: the enum the package types its classes with.
  const types = readFileSync(resolveMagma('icons/dist/mgg-icons.d.ts'), 'utf8');
  const members = new Map(
    [...types.matchAll(/^\s+(\w+) = "([^"]+)",?$/gm)].map(([, member, className]) => [
      className,
      member,
    ]),
  );
  legacy = Object.entries(dictionary).map(([name, source]) => {
    const [from, file] = source.split('/');
    const slug =
      SAME_DRAWING[/** @type {keyof typeof SAME_DRAWING} */ (name)] ??
      SOURCES[/** @type {keyof typeof SOURCES} */ (from)]?.(file);
    if (!slug) throw new Error(`icons: no iconsauce slug for "${name}" (${source})`);
    const className = `mgg-icons-${name}`;
    const member = members.get(className);
    if (!member) throw new Error(`icons: "${className}" missing from mgg-icons.d.ts`);
    const set = /** @type {IconSetId} */ (slug.split('/')[0]);
    return { name, className, member, slug, set };
  });
  return legacy;
}

/**
 * @typedef {object} SetIcon
 * @property {string} name the last part of the slug
 * @property {string[]} categories ids of its categories, none when the set has none
 * @property {string[]} keywords tags, aliases and names in the icons package, for the search
 */

/**
 * @typedef {object} IconSet
 * @property {IconSetId} id
 * @property {string[]} styles Material Icons only
 * @property {{ id: string, label: string | null, count: number }[]} categories
 *   in the order of the menu; `label: null` for the categories the page names
 *   (OTHER_CATEGORY, DEPRECATED_CATEGORY)
 * @property {SetIcon[]} icons sorted by name
 */

/** The id of the category of the icons that have none. */
export const OTHER_CATEGORY = 'other';

/** The id of the category of the icons their set has deprecated, which they are only in. */
export const DEPRECATED_CATEGORY = 'deprecated';

/** The categories the page names, at the end of the menu in this order. */
const PAGE_CATEGORIES = [OTHER_CATEGORY, DEPRECATED_CATEGORY];

/** A package installed with an iconsauce plugin, which depends on it. */
const fromPlugin = (/** @type {string} */ plugin, /** @type {string} */ file) =>
  createRequire(require.resolve(plugin)).resolve(file);

/** The names Google gives its categories, where they are not the id capitalized. */
const MATERIAL_CATEGORIES = { av: 'Audio and video' };

const capitalize = (/** @type {string} */ text) => text.charAt(0).toUpperCase() + text.slice(1);

/** An id for a category name, as a URL carries it: `Files / Folders` -> `files-folders`. */
const categoryId = (/** @type {string} */ label) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * The categories of a list of icons, by label, with the icons that have none
 * in OTHER_CATEGORY at the end. A set without categories has none at all.
 * @param {SetIcon[]} icons
 * @param {Map<string, string>} labels id -> label
 */
function categoriesOf(icons, labels) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const icon of icons) {
    if (icon.categories.length === 0 && labels.size > 0) icon.categories.push(OTHER_CATEGORY);
    for (const id of icon.categories) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const label = (/** @type {string} */ id) =>
    PAGE_CATEGORIES.includes(id) ? null : (labels.get(id) ?? id);
  const last = (/** @type {string} */ id) => PAGE_CATEGORIES.indexOf(id) + 1;
  return [...counts]
    .map(([id, count]) => ({ id, label: label(id), count }))
    .sort((a, b) => last(a.id) - last(b.id) || (a.label ?? '').localeCompare(b.label ?? ''));
}

/** The names of the icons package that draw each slug, as search keywords. */
function legacyNames() {
  /** @type {Map<string, string[]>} */
  const names = new Map();
  for (const { slug, name } of legacyIcons()) names.set(slug, [...(names.get(slug) ?? []), name]);
  return names;
}

/** @type {Map<IconSetId, IconSet>} */
const sets = new Map();

/**
 * An icon set with its categories.
 * - Material Icons: the one category Google gives each icon, and its tags
 *   (@material-icons/svg/data.json).
 * - Material Design Icons: the tags of the Pictogrammers community as
 *   categories (an icon can have several), and the aliases
 *   (the meta.json of @mdi/svg). Deprecated icons are only in
 *   DEPRECATED_CATEGORY.
 * - Maggioli: svg-icons publishes no categories yet. With a `dist/meta.json`
 *   (`icons` as in Material's data.json plus `aliases`, and `categories` with
 *   their labels) the page shows them.
 * The names of the icons package that draw an icon are among its keywords.
 * @param {IconSetId} id
 * @returns {IconSet}
 */
export function iconSet(id) {
  const cached = sets.get(id);
  if (cached) return cached;
  const legacy = legacyNames();
  /** @type {SetIcon[]} */
  let icons;
  /** @type {Map<string, string>} */
  const labels = new Map();

  if (id === 'mi') {
    /** @type {{ icons: { name: string, categories: string[], tags?: string[] }[] }} */
    const data = require(fromPlugin('@iconsauce/material-icons', '@material-icons/svg/data.json'));
    icons = data.icons.map(({ name, categories, tags = [] }) => {
      const slugName = name.replaceAll('_', '-');
      for (const category of categories) {
        labels.set(
          category,
          MATERIAL_CATEGORIES[/** @type {keyof typeof MATERIAL_CATEGORIES} */ (category)] ??
            capitalize(category),
        );
      }
      return {
        name: slugName,
        categories: [...categories],
        keywords: [...tags, ...(legacy.get(slugOf('mi', slugName)) ?? [])],
      };
    });
  } else if (id === 'mdi') {
    /** @type {{ name: string, tags: string[], aliases: string[], deprecated: boolean }[]} */
    // Split, or iconsauce would read the path as an icon slug of the site.
    const meta = require(fromPlugin('@iconsauce/mdi-svg', '@mdi' + '/svg/meta.json'));
    icons = meta.map(({ name, tags, aliases, deprecated }) => {
      for (const tag of tags) labels.set(categoryId(tag), tag);
      return {
        name,
        categories: deprecated ? [DEPRECATED_CATEGORY] : tags.map(categoryId),
        keywords: [...tags, ...aliases, ...(legacy.get(slugOf('mdi', name)) ?? [])],
      };
    });
  } else {
    /** @type {string[]} */
    const slugs = require(resolveMagma('svg-icons/dist/iconsauce.json'));
    /** @type {{ categories?: { id: string, label: string }[], icons?: { name: string, categories?: string[], tags?: string[], aliases?: string[] }[] } | undefined} */
    let meta;
    try {
      meta = require(resolveMagma('svg-icons/dist/meta.json'));
    } catch {
      meta = undefined;
    }
    for (const { id: category, label } of meta?.categories ?? []) labels.set(category, label);
    const known = new Map((meta?.icons ?? []).map((icon) => [icon.name, icon]));
    icons = slugs.map((slug) => {
      const name = slug.slice('mgg/'.length);
      const icon = known.get(name);
      return {
        name,
        categories: [...(icon?.categories ?? [])],
        keywords: [...(icon?.tags ?? []), ...(icon?.aliases ?? []), ...(legacy.get(slug) ?? [])],
      };
    });
  }

  for (const icon of icons) icon.keywords = [...new Set(icon.keywords)];
  icons.sort((a, b) => a.name.localeCompare(b.name));
  /** @type {IconSet} */
  const set = {
    id,
    styles: id === 'mi' ? MATERIAL_STYLES : [],
    categories: categoriesOf(icons, labels),
    icons,
  };
  sets.set(id, set);
  return set;
}
