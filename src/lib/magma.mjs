// Single entry point to the Magma data the site is built from.
// Rule: everything is read from node_modules, never from the Magma monorepo.
// If something is missing here, it is a Magma packaging bug: track it in
// https://github.com/magma-design-system/docs/issues/1
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

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

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

let domains;

/**
 * The domains of the design language the installed magma ships: the files of
 * `agents/patterns/` whose frontmatter says `kind: foundation`
 * (https://github.com/magma-design-system/magma/issues/1189), each with its id
 * (the file name), its frontmatter and its body as written. The contract is
 * "The patterns" in Magma's docs/CONTRACTS.md and "A domain of Foundation" in
 * its docs/PATTERNS.md. Empty for a version that ships none (2.9.0 and before):
 * the folder sits beside the package's AGENTS.md. Each with the previews of
 * its cases and its rules, by file name (readPreviews()).
 * @returns {{ id: string, frontmatter: string, body: string, previews: Preview[] }[]}
 */
export function loadDomains() {
  if (domains) return domains;
  const folder = path.join(path.dirname(resolveMagma('magma/AGENTS.md')), 'agents', 'patterns');
  domains = [];
  if (!existsSync(folder)) return domains;
  for (const name of readdirSync(folder).sort()) {
    if (!name.endsWith('.md')) continue;
    const source = readFileSync(path.join(folder, name), 'utf8');
    const match = FRONTMATTER.exec(source);
    if (!match || !/^kind:\s*foundation\s*$/m.test(match[1])) continue;
    const id = name.slice(0, -'.md'.length);
    domains.push({
      id,
      frontmatter: match[1],
      body: source.slice(match[0].length),
      previews: readPreviews(path.join(folder, 'previews', id)),
    });
  }
  return domains;
}

/**
 * A preview: `id` is the name of its file, the case or the rule it shows,
 * which the loader of its page sets in `of`.
 * @typedef {{ id: string, of?: 'case' | 'rule', try: string, height?: number, wholePage: boolean, markup: string }} Preview
 */

// The opening comment of a preview: its keys, one `key: value` per line.
const PREVIEW_HEAD = /^\s*<!--([\s\S]*?)-->[ \t]*\n?/;

/**
 * The previews of a pattern or a domain, from the installed magma
 * (`agents/patterns/previews/<id>/<case or rule>.html`, "The preview of a
 * case" in Magma's docs/PATTERNS.md): the stage, what to try in it (required), the
 * height of an overlay and `whole-page`, a stage with a frame of its own that
 * takes no inset. None when the folder is missing (a domain with no preview).
 * Magma's check holds the format; a preview without what to try fails here
 * too, so the page never shows a still stage with nothing said.
 * @param {string} folder
 * @returns {Preview[]}
 */
function readPreviews(folder) {
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((name) => name.endsWith('.html'))
    .sort()
    .map((name) => {
      const source = readFileSync(path.join(folder, name), 'utf8').replace(/\r\n/g, '\n');
      const head = PREVIEW_HEAD.exec(source);
      const keys = Object.fromEntries(
        (head?.[1] ?? '')
          .split('\n')
          .map((line) => /^\s*([a-z-]+):\s*(.*?)\s*$/.exec(line))
          .filter(Boolean)
          .map((match) => [match[1], match[2]]),
      );
      if (!keys.try) throw new Error(`The preview ${path.join(folder, name)} says nothing to try`);
      return {
        id: name.slice(0, -'.html'.length),
        try: keys.try,
        ...(keys.height ? { height: Number(keys.height) } : {}),
        wholePage: keys['whole-page'] === 'true',
        markup: head ? source.slice(head[0].length) : source,
      };
    });
}

/**
 * The page of a component in Magma's published Storybook: its docs page, with
 * every story. documentation.json gives the address of Storybook and the id of
 * each component's page, since the ids do not follow the tags (`mds-img` is
 * `ui-image`).
 * @param {string} tag
 * @returns {string | undefined}
 */
export function storybookPage(tag) {
  const docs = loadComponentDocs();
  const id = docs.components.find((/** @type {{ tag: string }} */ c) => c.tag === tag)?.storybook;
  return id ? `${docs.storybook}?path=/docs/${id}` : undefined;
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
