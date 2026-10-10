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
 * Sorted list of component tags, used by the sidebar and the routes.
 * @returns {string[]}
 */
export function componentTags() {
  return loadComponentDocs()
    .components.map((/** @type {{ tag: string }} */ c) => c.tag)
    .sort();
}
