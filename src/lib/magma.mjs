// Single entry point to the Magma data the site is built from.
// Rule: everything is read from node_modules, never from the Magma monorepo.
// If something is missing here, it is a Magma packaging bug: track it in
// https://github.com/magma-design-system/docs/issues/1
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Root directory of an installed Magma package.
 *
 * Files are read from disk instead of required by subpath because the
 * `exports` map of @maggioli-design-system/magma 2.0.1 does not expose
 * `./dist/documentation.json` nor `./package.json`, so
 * `require('@maggioli-design-system/magma/dist/documentation.json')` throws.
 * Packages without an `exports` map (svg-icons has no entry point at all) are
 * found through their package.json.
 */
export function packageDir(pkg) {
  const name = `@maggioli-design-system/${pkg}`;
  try {
    return dirname(require.resolve(`${name}/package.json`));
  } catch {
    // blocked by the `exports` map: walk up from the main entry point
  }
  let dir = dirname(require.resolve(name));
  while (dir !== dirname(dir)) {
    try {
      if (JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name === name) return dir;
    } catch {
      // no package.json at this level, keep walking up
    }
    dir = dirname(dir);
  }
  throw new Error(`Cannot find the root of ${name} in node_modules`);
}

function readJson(pkg, file) {
  return JSON.parse(readFileSync(join(packageDir(pkg), file), 'utf8'));
}

let componentDocs;

/** Stencil docs-json output of @maggioli-design-system/magma. */
export function loadComponentDocs() {
  componentDocs ??= readJson('magma', 'dist/documentation.json');
  return componentDocs;
}

/** Installed version of a Magma package, for "built against" notices. */
export function magmaVersion(pkg = 'magma') {
  return readJson(pkg, 'package.json').version;
}

/**
 * Directory of the prebuilt SVG icons of @maggioli-design-system/svg-icons.
 * Files are flat (`<name>.svg`); `dist/iconsauce.json` names them `mgg/<name>`.
 */
export function svgIconsDir() {
  return join(packageDir('svg-icons'), 'dist/svg');
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
