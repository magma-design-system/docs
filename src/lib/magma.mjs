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
 * The rules of Magma's lint, read from the ESLint and Stylelint plugins of the
 * installed magma (`magma/eslint`, `magma/stylelint/*`), in the order of the
 * plugins: each rule with the tools that run it and its severity in the
 * `recommended` and `strict` presets (`error` or `warn`).
 * @returns {Promise<{ name: string, tools: string[], recommended: string, strict: string }[]>}
 */
export async function lintRules() {
  const eslint = (await import('@maggioli-design-system/magma/eslint')).default;
  const stylelint = {
    recommended: (await import('@maggioli-design-system/magma/stylelint/recommended')).default,
    strict: (await import('@maggioli-design-system/magma/stylelint/strict')).default,
  };
  /** @type {Map<string, { name: string, tools: string[], recommended: string, strict: string }>} */
  const rules = new Map();
  const rule = (/** @type {string} */ name) => {
    const short = name.replace(/^magma\//, '');
    if (!rules.has(short))
      rules.set(short, { name: short, tools: [], recommended: '', strict: '' });
    return /** @type {NonNullable<ReturnType<typeof rules.get>>} */ (rules.get(short));
  };
  for (const preset of /** @type {const} */ (['recommended', 'strict'])) {
    for (const [name, level] of Object.entries(eslint.configs[preset].rules ?? {})) {
      const entry = rule(name);
      if (!entry.tools.includes('ESLint')) entry.tools.push('ESLint');
      entry[preset] = Array.isArray(level) ? String(level[0]) : String(level);
    }
    for (const [name, value] of Object.entries(stylelint[preset].rules ?? {})) {
      const entry = rule(name);
      if (!entry.tools.includes('Stylelint')) entry.tools.push('Stylelint');
      // Stylelint: `true` is an error, `[true, { severity: 'warning' }]` a warning.
      const severity = Array.isArray(value) ? value[1]?.severity : undefined;
      const level = severity === 'warning' ? 'warn' : 'error';
      // A rule run by both tools has the same severity in each.
      entry[preset] ||= level;
    }
  }
  return [...rules.values()];
}

/**
 * The tools of the installed `magma-mcp`, in its order, from the definitions
 * magma exports as data (`dist/lint/mcp/tools.json`, what `tools/list`
 * answers; magma#1127): each tool with its title and its arguments, the
 * required ones flagged.
 * @returns {{ name: string, title: string, args: { name: string, required: boolean }[] }[]}
 */
export function mcpTools() {
  /** @type {{ tools: { name: string, title: string, inputSchema: { properties?: object, required?: string[] } }[] }} */
  const { tools } = require(resolveMagma('magma/dist/lint/mcp/tools.json'));
  return tools.map(({ name, title, inputSchema: { properties = {}, required = [] } }) => ({
    name,
    title,
    args: Object.keys(properties).map((arg) => ({ name: arg, required: required.includes(arg) })),
  }));
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
 * where it names several). Shipped since Magma 2.6.0 (magma#1106).
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
