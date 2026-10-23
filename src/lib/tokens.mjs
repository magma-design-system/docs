// The global tokens of Magma, for the Tokens section: the DTCG 2025.10 data of
// design-tokens and styles (`dist/dtcg/`) and the Tailwind consumption map of
// styles (`dist/tailwind/consumption.json`). The resolver of styles names every
// set of both packages, so it is the only entry point. Everything is read from
// node_modules (src/lib/magma.mjs); the two kinds of data share the custom
// property a token is published as (`$extensions["it.maggioli.magma"].css`).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { resolveMagma } from './magma.mjs';

const EXT = 'it.maggioli.magma';

/**
 * @typedef {'primitive' | 'semantic' | 'internal'} Tier
 * @typedef {{
 *   $type: string,
 *   $value: unknown,
 *   $description?: string,
 *   $extensions?: Record<string, any>,
 * }} RawToken
 * @typedef {{
 *   path: string,
 *   name: string,
 *   group: string,
 *   key: string,
 *   css?: string,
 *   tier: Tier,
 *   type: string,
 *   value: unknown,
 *   raw: unknown,
 *   cssValue?: string,
 *   description?: string,
 *   target?: string,
 *   live: boolean,
 * }} Token
 * @typedef {Record<string, string>} Condition
 */

/** @param {string} file */
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

let resolverFile;
let resolver;

function loadResolver() {
  resolverFile ??= resolveMagma('styles/dist/dtcg/magma.resolver.json');
  resolver ??= readJson(resolverFile);
  return resolver;
}

/** @type {Map<string, Map<string, RawToken>>} */
const files = new Map();

/**
 * The tokens of one file of the resolver, by path. A group's own token
 * (`$root`) keeps `$root` in its path, as the aliases name it.
 * @param {string} ref
 */
function tokensOf(ref) {
  const file = resolve(dirname(resolverFile), ref);
  let tokens = files.get(file);
  if (tokens) return tokens;
  tokens = new Map();
  const walk = (/** @type {any} */ node, /** @type {string[]} */ path) => {
    if (node && typeof node === 'object' && '$value' in node) {
      tokens.set(path.join('.'), node);
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, child] of Object.entries(node)) {
      if (key === '$root' || !key.startsWith('$')) walk(child, [...path, key]);
    }
  };
  walk(readJson(file), []);
  files.set(file, tokens);
  return tokens;
}

/**
 * The modifiers of the resolver (mode, theme, corner shape, depth): their
 * contexts in the resolver's order and the default one.
 * @returns {{ name: string, description: string, contexts: string[], default: string }[]}
 */
export function modifiers() {
  const { modifiers } = loadResolver();
  return Object.entries(modifiers).map(([name, modifier]) => ({
    name,
    description: modifier.description ?? '',
    contexts: Object.keys(modifier.contexts),
    default: modifier.default,
  }));
}

/** The condition of the stylesheets with no class or attribute: every modifier at its default. */
export const DEFAULT_CONDITION = Object.freeze(/** @type {Condition} */ ({}));

/**
 * The files to merge for a condition, in the resolver's order.
 * @param {Condition} condition
 * @returns {string[]}
 */
function refsFor(condition) {
  const { sets, modifiers, resolutionOrder } = loadResolver();
  /** @type {string[]} */
  const refs = [];
  for (const { $ref } of resolutionOrder) {
    const [, kind, name] = /^#\/(sets|modifiers)\/(.+)$/.exec($ref) ?? [];
    if (kind === 'sets') {
      refs.push(...sets[name].sources.map((/** @type {any} */ s) => s.$ref));
    } else if (kind === 'modifiers') {
      const modifier = modifiers[name];
      const context = condition[name] ?? modifier.default;
      const sources = modifier.contexts[context];
      if (!sources) throw new Error(`No context "${context}" in the modifier "${name}"`);
      refs.push(...sources.map((/** @type {any} */ s) => s.$ref));
    }
  }
  return refs;
}

/** @type {Map<string, Map<string, Token>>} */
const resolved = new Map();

/** `{palette.tone.neutral.08}` -> `palette.tone.neutral.08`. */
const ALIAS = /^\{([^}]+)\}$/;

/**
 * Every token in one condition, its aliases resolved, by path. A later file
 * replaces a token of an earlier one, as the resolver says.
 * @param {Condition} [condition]
 * @returns {Map<string, Token>}
 */
export function tokenSet(condition = DEFAULT_CONDITION) {
  loadResolver();
  const id = JSON.stringify(Object.entries(condition).sort());
  const cached = resolved.get(id);
  if (cached) return cached;

  /** @type {Map<string, RawToken>} */
  const merged = new Map();
  /** The tokens design-tokens publishes: its colors are always rgb channels. */
  const channels = new Set();
  for (const ref of refsFor(condition)) {
    const fromDesignTokens = ref.includes('/design-tokens/');
    for (const [path, token] of tokensOf(ref)) {
      merged.set(path, token);
      if (fromDesignTokens) channels.add(path);
      else channels.delete(path);
    }
  }

  const lookup = (/** @type {string} */ path) => merged.get(path) ?? merged.get(`${path}.$root`);
  /** The value with every alias in it replaced by the value it names. */
  const deep = (/** @type {unknown} */ value, depth = 0) => {
    if (depth > 20) throw new Error('Alias loop in the token data');
    if (typeof value === 'string') {
      const alias = ALIAS.exec(value);
      if (!alias) return value;
      const target = lookup(alias[1]);
      if (!target) throw new Error(`Unresolved alias ${value}`);
      return deep(target.$value, depth + 1);
    }
    if (Array.isArray(value)) return value.map((v) => deep(v, depth));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deep(v, depth)]));
    }
    return value;
  };
  /** The last token with a custom property an alias chain goes through. */
  const targetOf = (/** @type {RawToken} */ token) => {
    let css;
    let current = token;
    for (let hop = 0; hop < 20; hop++) {
      const alias = typeof current.$value === 'string' && ALIAS.exec(current.$value);
      if (!alias) return css;
      const next = lookup(alias[1]);
      if (!next) return css;
      css = next.$extensions?.[EXT]?.css ?? css;
      current = next;
    }
    return css;
  };

  /** @type {Map<string, Token>} */
  const tokens = new Map();
  for (const [path, raw] of merged) {
    const ext = raw.$extensions?.[EXT] ?? {};
    const name = path.replace(/\.\$root$/, '');
    const segments = name.split('.');
    tokens.set(path, {
      path,
      name,
      group: segments.slice(0, -1).join('.'),
      key: segments.at(-1) ?? name,
      css: ext.css,
      tier: ext.tier,
      type: raw.$type,
      value: deep(raw.$value),
      raw: raw.$value,
      cssValue: ext.cssValue,
      description: raw.$description,
      target: targetOf(raw),
      // A color the page can paint as `rgb(var(--x))`: design-tokens writes
      // every color as channels; the globals of styles mix channels and
      // complete colors, and the data does not say which.
      live: raw.$type === 'color' && Boolean(ext.css) && channels.has(path),
    });
  }
  resolved.set(id, tokens);
  return tokens;
}

/**
 * The tokens whose name starts with one of `prefixes` (`magma.surface`,
 * `radius`, ...), in the order of the data.
 * @param {string | string[]} prefixes
 * @param {Condition} [condition]
 * @returns {Token[]}
 */
export function tokensIn(prefixes, condition) {
  const list = [prefixes].flat();
  return [...tokenSet(condition).values()].filter((token) =>
    list.some((prefix) => token.name === prefix || token.name.startsWith(`${prefix}.`)),
  );
}

/**
 * The token an alias names (`{font.title}`), if the value is one.
 * @param {unknown} value
 * @param {Condition} [condition]
 */
export function aliased(value, condition) {
  const alias = typeof value === 'string' && ALIAS.exec(value);
  return alias ? tokenNamed(alias[1].replace(/\.\$root$/, ''), condition) : undefined;
}

/**
 * A token by name (`magma.surface.default`) in a condition.
 * @param {string} name
 * @param {Condition} [condition]
 */
export function tokenNamed(name, condition) {
  const set = tokenSet(condition);
  return set.get(name) ?? set.get(`${name}.$root`);
}

/**
 * The `cssOnly` values of a group as tokens, for the tables: their value is
 * the CSS one, they have no type in DTCG.
 * @param {string} group
 * @returns {Token[]}
 */
export function cssOnlyTokens(group) {
  return cssOnly(group).map(({ css, value }) => ({
    path: css,
    name: css,
    group,
    key: css,
    css,
    tier: 'primitive',
    type: 'css',
    value,
    raw: value,
    cssValue: value,
    live: false,
  }));
}

/**
 * The values a group lists in its `cssOnly` extension: custom properties DTCG
 * has no type for (`--spacing-prose: 65ch`, the transition property lists).
 * @param {string} group
 * @returns {{ css: string, value: string }[]}
 */
export function cssOnly(group) {
  loadResolver();
  for (const ref of refsFor(DEFAULT_CONDITION)) {
    let node = readJson(resolve(dirname(resolverFile), ref));
    for (const key of group.split('.')) node = node?.[key];
    const list = node?.$extensions?.[EXT]?.cssOnly;
    if (list) return list;
  }
  return [];
}

// --- Values as CSS writes them -------------------------------------------

/** @param {number} n */
const num = (n) => String(Math.round(n * 10000) / 10000);

/** @param {any} color */
function formatColor(color) {
  if (typeof color === 'string') return color;
  const alpha = color.alpha ?? 1;
  if (alpha >= 1 && color.hex) return color.hex;
  const [r, g, b] = color.components.map((/** @type {number} */ c) => Math.round(c * 255));
  return `rgb(${r} ${g} ${b} / ${num(alpha)})`;
}

/** @param {any} d */
const formatDimension = (d) =>
  d && typeof d === 'object' ? `${num(d.value)}${d.unit}` : String(d);

/** @param {any} s */
function formatShadow(s) {
  const layer = (/** @type {any} */ l) =>
    [
      l.inset ? 'inset' : '',
      formatDimension(l.offsetX),
      formatDimension(l.offsetY),
      formatDimension(l.blur),
      formatDimension(l.spread),
      formatColor(l.color),
    ]
      .filter(Boolean)
      .join(' ');
  return [s].flat().map(layer).join(', ');
}

/** @param {string | string[]} family */
const formatFamily = (family) =>
  [family]
    .flat()
    .map((name) => (/\s/.test(name) ? `'${name}'` : name))
    .join(', ');

/**
 * The value of a token as the stylesheets write it, or as close as one line
 * gets: hex colors (the CSS publishes rgb channels), `cubic-bezier()`, the
 * layers of a shadow. `cssValue` wins where the data has one.
 * @param {Token} token
 * @returns {string}
 */
export function formatValue(token) {
  if (token.cssValue) return token.cssValue;
  const value = /** @type {any} */ (token.value);
  switch (token.type) {
    case 'color':
      return formatColor(value);
    case 'dimension':
    case 'duration':
      return formatDimension(value);
    case 'cubicBezier':
      return `cubic-bezier(${value.map(num).join(', ')})`;
    case 'fontFamily':
      return formatFamily(value);
    case 'shadow':
      return formatShadow(value);
    case 'border':
      return `${formatDimension(value.width)} ${value.style} ${formatColor(value.color)}`;
    case 'typography':
      return `${value.fontWeight} ${formatDimension(value.fontSize)}/${value.lineHeight} ${formatFamily(value.fontFamily)}`;
    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}

/**
 * The value of a token computed for its condition: where the CSS value reads
 * other custom properties (`calc(1px * var(--depth))`), the value the data
 * resolves it to, so that two conditions can be told apart.
 * @param {Token} token
 */
export function formatResolved(token) {
  if (token.cssValue && token.cssValue.includes('var(')) {
    return formatValue({ ...token, cssValue: undefined });
  }
  return formatValue(token);
}

/**
 * The color of a color token as hex, or `rgb()` with its alpha: for the
 * static swatches of conditions the page is not in.
 * @param {Token} token
 */
export const colorOf = (token) => formatColor(token.value);

// --- Tailwind ------------------------------------------------------------

let consumptionMap;

/** styles' `dist/tailwind/consumption.json`. */
export function consumption() {
  consumptionMap ??= readJson(resolveMagma('styles/dist/tailwind/consumption.json'));
  return consumptionMap;
}

let themeValues;

/**
 * Tailwind's own theme variables and their values (`--max-width-prose: 65ch`),
 * what a class shadowed by one of them writes.
 * @returns {Map<string, string>}
 */
function tailwindTheme() {
  if (themeValues) return themeValues;
  const file = createRequire(import.meta.url).resolve('tailwindcss/theme.css');
  themeValues = new Map(
    [...readFileSync(file, 'utf8').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value.trim()],
    ),
  );
  return themeValues;
}

/** The text measures of the spacing namespace (`--spacing-prose: 65ch`): widths. */
const MEASURES = new Set(['phrase', 'prose', 'text', 'title']);

/**
 * The utility root shown for a namespace: the most common use of its tokens.
 * Breakpoints are variants (`tablet:`), not utilities.
 * @type {Record<string, string>}
 */
const ROOT = {
  '--color': 'bg',
  '--font': 'font',
  '--text': 'text',
  '--leading': 'leading',
  '--spacing': 'gap',
  '--container': 'max-w',
  '--aspect': 'aspect',
  '--ease': 'ease',
  '--radius': 'rounded',
  '--shadow': 'shadow',
};

/**
 * For the tokens no utility reads (Tailwind 4 has no namespace for them), the
 * arbitrary value that uses them, by the start of the custom property.
 * @type {[string, (css: string) => string][]}
 */
const ARBITRARY = [
  ['--border-', (css) => `border-(length:${css})`],
  ['--duration-', (css) => `duration-(${css})`],
  ['--magma-radius-', (css) => `rounded-(${css})`],
  ['--mds-elevation-', (css) => `shadow-(${css})`],
  ['--magma-disabled-opacity', (css) => `opacity-(${css})`],
  ['--magma-backdrop-blur', (css) => `backdrop-blur-(${css})`],
];

/** The arbitrary value for a token no namespace reads, if there is a usual one. */
function arbitrary(/** @type {string} */ css) {
  if (css.endsWith('z-index')) return `z-(${css})`;
  return ARBITRARY.find(([prefix]) => css.startsWith(prefix))?.[1](css);
}

/**
 * The class Tailwind builds from the number alone, where that number is the
 * value of the token: `duration-75` writes 75ms, the value of
 * `--duration-75`, the class editors suggest. It writes the value, not the
 * variable: Tailwind reads `--transition-duration-75`, which styles does not
 * publish.
 * @param {string} css
 */
function bareValue(css) {
  const step = /^--duration-(\d+)$/.exec(css)?.[1];
  if (!step) return undefined;
  const token = [...tokenSet().values()].find((t) => t.css === css);
  return token && formatValue(token) === `${step}ms` ? `duration-${step}` : undefined;
}

/**
 * The utility of styles named after a token that writes its value:
 * `transition-cosmetic` sets the properties of `--transition-property-cosmetic`
 * (with the default duration and easing), without reading the variable.
 * @param {string} css
 */
function magmaUtility(css) {
  const name = css.replace(/^--transition-property-/, 'transition-');
  const utility = consumption().utilities[name];
  if (name === css || !utility) return undefined;
  const token = cssOnlyTokens('transition-property').find((t) => t.css === css);
  return token && utility.css.includes(`transition-property: ${formatValue(token)};`)
    ? name
    : undefined;
}

/** The class for a token no namespace reads: the bare value, or the arbitrary one. */
const unreadUtility = (/** @type {string} */ css) =>
  bareValue(css) ?? magmaUtility(css) ?? arbitrary(css);

/**
 * The color utility root by what the role paints: text roles are `fg-*` in
 * Tailwind (`text-fg-muted`), borders and the shadow ink have their own.
 * @param {string} key
 */
function colorRoot(key) {
  if (key === 'shadow-ink') return 'shadow';
  if (/(^|-)fg(-|$)|^on-|-on-/.test(key) || key.startsWith('text-')) return 'text';
  if (/(^|-)border(-|$)/.test(key)) return 'border';
  return 'bg';
}

/**
 * How Tailwind reads a token: the `@theme` variable that publishes it and
 * one class that uses it. Where that class reads another variable instead
 * (`max-w-xs` is `--spacing-xs`, not `--container-xs`), the class is the
 * arbitrary value of the token. Nothing for a value that comes with another
 * token (`--text-size-title-h1--line-height`) or that Tailwind cannot read.
 * @param {Token | { css?: string }} token
 * @returns {{ theme?: string, utility?: string, variant?: boolean } | undefined}
 */
export function tailwindOf(token) {
  const css = token.css;
  // The sizing scale has no custom property: its steps are the numeric
  // steps of the spacing utilities (`gap-400` = 400 x --spacing = 1rem).
  if (!css && 'group' in token && token.group === 'size') return { utility: `gap-${token.key}` };
  if (!css) return undefined;
  const entry = consumption().tokens[css];
  if (!entry) {
    const utility = unreadUtility(css);
    return utility ? { utility } : undefined;
  }
  const { theme, namespace, key, shadowed = {}, property } = entry;
  if (property) return { theme };
  if (!namespace) return { theme, utility: unreadUtility(css) };
  if (namespace === '--breakpoint') return { theme, utility: `${key}:`, variant: true };
  if (key == null) return { theme };
  const root =
    namespace === '--color'
      ? colorRoot(key)
      : namespace === '--spacing' && MEASURES.has(key)
        ? 'max-w'
        : ROOT[namespace];
  if (!root) return { theme };
  // A class that reads another variable is still the one to use when that
  // variable has the value of the token: `max-w-prose` writes 65ch, as
  // `--spacing-prose`.
  if (root in shadowed) {
    const reads = shadowed[root];
    const same = reads && 'value' in token && tailwindTheme().get(reads) === formatValue(token);
    return { theme, utility: same ? `${root}-${key}` : `${root}-(${css})` };
  }
  return { theme, utility: `${root}-${key}` };
}

/**
 * The tokens Tailwind reads through another variable for some classes: the
 * class, the variable it reads and the token it does not.
 * @returns {{ css: string, theme: string, root: string, reads: string | null }[]}
 */
export function shadowedClasses() {
  return Object.entries(consumption().tokens).flatMap(([css, entry]) =>
    Object.entries(entry.shadowed ?? {}).map(([root, reads]) => ({
      css,
      theme: entry.theme,
      root: root.includes('*') ? root.replace('*', entry.key) : `${root}-${entry.key}`,
      reads: /** @type {string | null} */ (reads),
    })),
  );
}

// --- Previews ------------------------------------------------------------

/**
 * @typedef {'color' | 'shadow' | 'font' | 'ease' | 'duration' | 'space' | 'radius' | 'border' | 'aspect' | 'outline' | 'opacity'} PreviewKind
 */

/**
 * What the preview of a token paints, if it can show one: the token applied to
 * a small sample (TokenPreview.astro).
 * @param {Token} token
 * @returns {PreviewKind | undefined}
 */
export function previewOf(token) {
  switch (token.type) {
    case 'color':
      return 'color';
    case 'shadow':
      return 'shadow';
    case 'fontFamily':
      return 'font';
    case 'cubicBezier':
      return 'ease';
    case 'duration':
      return 'duration';
    case 'border':
      return 'outline';
  }
  if (token.type === 'number' && token.css?.endsWith('opacity')) return 'opacity';
  if (token.type !== 'dimension' && token.type !== 'number') return undefined;
  if (token.group === 'size') return 'space';
  if (!token.css) return undefined;
  if (token.group === 'spacing') return 'space';
  if (token.group === 'radius' || token.group === 'magma.radius') return 'radius';
  if (token.group === 'border') return 'border';
  if (token.group === 'aspect') return 'aspect';
  return undefined;
}

/**
 * The control points of a `cubicBezier` token as an SVG path from (0, 1) to
 * (1, 0), y pointing down, for a viewBox of `-0.1 -0.4 1.2 1.8`: room for the
 * curves that overshoot (the `back` easings).
 * @param {Token} token
 */
export function easePath(token) {
  const [x1, y1, x2, y2] = /** @type {number[]} */ (token.value);
  return `M0 1C${num(x1)} ${num(1 - y1)} ${num(x2)} ${num(1 - y2)} 1 0`;
}

/**
 * Where a dot that a `cubicBezier` token moves starts and stops, as fractions
 * of its track: from 0 to 1, or inside them for the curves that overshoot
 * (the `back` easings), so that the overshoot stays on the track.
 * @param {Token} token
 */
export function easeTrack(token) {
  const [, y1, , y2] = /** @type {number[]} */ (token.value);
  let min = 0;
  let max = 1;
  for (let i = 1; i < 100; i++) {
    const t = i / 100;
    const y = 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
    min = Math.min(min, y);
    max = Math.max(max, y);
  }
  return { from: num(-min / (max - min)), to: num((1 - min) / (max - min)) };
}

// --- Figma ---------------------------------------------------------------

/**
 * The files design-tokens publishes for Figma (`dist/json/`): the palette in
 * the DTCG draft Figma imports as variables, one file per mode, and the
 * sizing in the format of the "Import/Export Variables" plugin.
 */
export const FIGMA_FILES = /** @type {const} */ ([
  { file: 'figma-magma-colors-light.tokens.json', content: 'colorsLight' },
  { file: 'figma-magma-colors-dark.tokens.json', content: 'colorsDark' },
  { file: 'figma-magma-tokens.json', content: 'sizing' },
]);

/**
 * Path of a Figma file of design-tokens.
 * @param {string} file
 */
export function figmaFile(file) {
  if (!FIGMA_FILES.some((f) => f.file === file)) throw new Error(`Not a Figma file: ${file}`);
  return resolveMagma(`design-tokens/dist/json/${file}`);
}

/**
 * How many variables a Figma file holds, and its size in bytes.
 * @param {string} file
 */
export function figmaFileInfo(file) {
  const text = readFileSync(figmaFile(file), 'utf8');
  const data = JSON.parse(text);
  let variables = 0;
  if (Array.isArray(data.variableIds)) {
    variables = data.variableIds.length;
  } else {
    const walk = (/** @type {any} */ node) => {
      if (node && typeof node === 'object' && '$value' in node) variables++;
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    };
    walk(data);
  }
  return { variables, bytes: Buffer.byteLength(text) };
}

// --- Native platforms ----------------------------------------------------

/**
 * The files design-tokens publishes for the native platforms that an app can
 * use as they are: the colors of both modes, with no other token. Left out:
 * the Objective-C files of `dist/ios/` and `dist/flutter/fonts.dart`, which do
 * not compile (agents/magma.md), and the `colors-*.dart` files, which split
 * `colors.dart` by group under the same class names.
 */
export const PLATFORM_FILES = /** @type {const} */ ([
  { platform: 'android', dir: 'android', file: 'colors.xml', content: 'androidColors' },
  { platform: 'ios', dir: 'ios-swift', file: 'StyleDictionary.swift', content: 'swiftClass' },
  { platform: 'ios', dir: 'ios-swift', file: 'StyleDictionaryColor.swift', content: 'swiftEnum' },
  { platform: 'flutter', dir: 'flutter', file: 'colors.dart', content: 'flutterColors' },
]);

/** One color of a platform file, by platform. */
const PLATFORM_COLOR = {
  android: /<color name="/g,
  ios: /static let \w+ = UIColor\(/g,
  flutter: /static const Color \w+ =/g,
};

/**
 * Path of a native platform file of design-tokens.
 * @param {string} platform
 * @param {string} file
 */
export function platformFile(platform, file) {
  const entry = PLATFORM_FILES.find((f) => f.platform === platform && f.file === file);
  if (!entry) throw new Error(`Not a platform file: ${platform}/${file}`);
  return resolveMagma(`design-tokens/dist/${entry.dir}/${file}`);
}

/**
 * How many colors a native platform file holds, both modes together, and its
 * size in bytes.
 * @param {keyof typeof PLATFORM_COLOR} platform
 * @param {string} file
 */
export function platformFileInfo(platform, file) {
  const text = readFileSync(platformFile(platform, file), 'utf8');
  return {
    colors: text.match(PLATFORM_COLOR[platform])?.length ?? 0,
    bytes: Buffer.byteLength(text),
  };
}
