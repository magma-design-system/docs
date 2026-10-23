// Single entry point to the Magma data the site is built from.
// Rule: everything is read from node_modules, never from the Magma monorepo.
// If something is missing here, it is a Magma packaging bug: track it in
// https://github.com/magma-design-system/docs/issues/1
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Path of a file of an installed Magma package, by its subpath
 * (`magma/dist/documentation.json`): through the `exports` map where the
 * package has one, straight from the package folder where it has none
 * (svg-icons).
 * @param {string} subpath
 * @returns {string}
 */
export function resolveMagma(subpath) {
  return require.resolve(`@maggioli-design-system/${subpath}`);
}

let componentDocs;

/** Stencil docs-json output of @maggioli-design-system/magma. */
export function loadComponentDocs() {
  componentDocs ??= require(resolveMagma('magma/dist/documentation.json'));
  return componentDocs;
}

/** Installed version of a Magma package, for "built against" notices. */
export function magmaVersion(pkg = 'magma') {
  return require(resolveMagma(`${pkg}/package.json`)).version;
}

/**
 * What the installed Magma asks of a project, for the install guide: the
 * versions of magma and its wrappers, the ranges of styles and design-tokens
 * magma declares, the Angular versions magma-angular supports.
 */
export function magmaRequirements() {
  const manifest = (/** @type {string} */ pkg) => require(resolveMagma(`${pkg}/package.json`));
  const magma = manifest('magma');
  const angular = manifest('magma-angular');
  return {
    magma: magma.version,
    react: manifest('magma-react').version,
    angular: angular.version,
    angularCore: angular.peerDependencies['@angular/core'],
    styles: magma.dependencies['@maggioli-design-system/styles'],
    designTokens: magma.dependencies['@maggioli-design-system/design-tokens'],
  };
}

/**
 * Sorted list of component tags, used by the sidebar and the routes.
 * @returns {string[]}
 */
export function componentTags() {
  return loadComponentDocs()
    .components.map((/** @type {{ tag: string }} */ c) => c.tag)
    .sort();
}

/**
 * The category of each component and the parent of each part of a compound,
 * from the JSDoc of documentation.json: `@category <id>` on a component that
 * stands alone, `@parent <tag>` on a part (its direct parent, the first one
 * where it names several). Proposed in
 * https://github.com/magma-design-system/magma/issues/1106: until Magma ships them, only
 * `mds-pref` has a category.
 * @returns {{ categories: Map<string, string>, parents: Map<string, string> }}
 */
export function componentTaxonomy() {
  if (taxonomy) return taxonomy;
  const categories = new Map();
  const parents = new Map();
  for (const { tag, docsTags = [] } of loadComponentDocs().components) {
    for (const { name, text = '' } of docsTags) {
      if (name === 'category') categories.set(tag, text.trim());
      if (name === 'parent') parents.set(tag, text.trim().split(/\s+/)[0]);
    }
  }
  taxonomy = { categories, parents };
  return taxonomy;
}

/** @type {ReturnType<typeof componentTaxonomy> | undefined} */
let taxonomy;

/**
 * The component a tag is a part of, through the parents of its parents; the
 * tag itself when it stands alone.
 * @param {string} tag
 * @returns {string}
 */
export function componentRoot(tag) {
  const parent = componentTaxonomy().parents.get(tag);
  return parent ? componentRoot(parent) : tag;
}

/**
 * The parts of a compound component, at any depth, in the order of their tags.
 * @param {string} tag
 */
export function componentParts(tag) {
  return componentTags().filter((part) => part !== tag && componentRoot(part) === tag);
}

/**
 * How many components there are, how many properties they have, and how many
 * of those are also HTML attributes (a string, a number or a boolean): the
 * others, such as arrays and functions, can only be set from JavaScript.
 */
export function apiCounts() {
  const { components } = loadComponentDocs();
  const props = components.flatMap((/** @type {{ props: { attr?: string }[] }} */ c) => c.props);
  return {
    components: components.length,
    properties: props.length,
    attributes: props.filter((prop) => prop.attr).length,
  };
}

/** An icon slug: `mi/<variant>/<name>`, `mdi/<name>` or `mgg/<name>`. */
export const ICON_SLUG =
  /\b(?:mi\/(?:baseline|outline|round|sharp|two-tone)\/[a-z0-9-]+|mdi\/[a-z0-9-]+|mgg\/[a-z0-9-]+)/g;

/**
 * The icons the usage docs of the components use most, most used first: the
 * choice of the icon controls of the previews (src/components/Playground.astro).
 * iconsauce collects them, since it reads documentation.json.
 * @param {number} limit
 * @returns {string[]}
 */
export function usageIcons(limit) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const component of loadComponentDocs().components) {
    for (const markdown of Object.values(component.usage ?? {})) {
      for (const [slug] of String(markdown).matchAll(ICON_SLUG)) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);
}
