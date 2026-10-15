// The brand assets of @maggioli-design-system/identity, for the Brand assets
// section: every artwork of dist/ (one SVG each, with its PDF and its PNG and
// WebP renderings), grouped as the pages show them. One page per folder of
// dist/ (IDENTITY_GROUPS), one heading per owner (the folder below it), one
// family per brand or product, one tile per artwork of the family.
//
// What each artwork is comes from dist/identity.json: its family, the name of
// the family as the artwork writes it, its owner, its form, its color and the
// background it is drawn for. The package has no descriptions and no usage
// rules: the pages write a description from the kind of family, a default of
// this site.
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { resolveMagma } from './magma.mjs';

export const IDENTITY_PACKAGE = '@maggioli-design-system/identity';

/** The folders of dist/, in the order of the section, and the page of each. */
export const IDENTITY_GROUPS = /** @type {const} */ ([
  { id: 'brand', page: 'logos' },
  { id: 'products', page: 'products' },
  { id: 'avatar', page: 'avatars' },
  { id: 'illustrations', page: 'illustrations' },
  { id: 'internal', page: 'internal' },
]);

/** Color variants, in the order of the tiles. */
export const COLORS = ['color', 'blue', 'gold', 'dark-gold', 'black', 'white'];
/** Forms of a logo, in the order of the tiles. */
export const FORMS = ['logo', 'bordered', 'symbol'];

/** The installed dist/ folder of the package. */
function distDir() {
  return path.dirname(resolveMagma('identity/dist/identity.json'));
}

/**
 * @typedef {{ file: string, path: string, bytes: number, width?: number }} IdentityFile
 * @typedef {{
 *   stem: string, dir: string, family: string, kind: string, form?: string, color: string,
 *   background: string, width: number, height: number,
 *   svg: IdentityFile, pdf?: IdentityFile, png: IdentityFile[], webp: IdentityFile[],
 * }} IdentityAsset
 * @typedef {{
 *   id: string, name: string, kind: string, group: string, owner?: string,
 *   forms: string[], assets: IdentityAsset[],
 * }} IdentityFamily
 * @typedef {{ id: string, name: string, families: IdentityFamily[] }} IdentityOwner
 * @typedef {{
 *   id: string, name: string, kind: string, group: string,
 *   owner: { id: string, name: string },
 *   variants: {
 *     path: string, form?: string, color: string, background: string,
 *     width: number, height: number,
 *   }[],
 *   formats: { svg: boolean, pdf: boolean, png: number[], webp: number[] },
 * }} ManifestFamily
 */

/** @type {ManifestFamily[] | undefined} */
let manifest;

/** The families of artworks of dist/identity.json, in the order of the package. */
function identityManifest() {
  manifest ??= JSON.parse(readFileSync(path.join(distDir(), 'identity.json'), 'utf8')).assets;
  return /** @type {ManifestFamily[]} */ (manifest);
}

/** @type {IdentityAsset[] | undefined} */
let assets;

/**
 * Every artwork of the package, one per variant of the manifest, with its
 * files. A file the manifest lists and dist/ lacks fails the build.
 * @returns {IdentityAsset[]}
 */
export function identityAssets() {
  if (assets) return assets;
  const dist = distDir();
  const info = (rel, width) => ({
    file: path.posix.basename(rel),
    path: rel,
    bytes: statSync(path.join(dist, rel)).size,
    ...(width ? { width } : {}),
  });
  assets = identityManifest().flatMap(({ id, kind, variants, formats }) =>
    variants.map(({ path: stem, form, color, background, width, height }) => ({
      stem: path.posix.basename(stem),
      dir: path.posix.dirname(stem),
      family: id,
      kind,
      ...(form ? { form } : {}),
      color,
      background,
      width,
      height,
      svg: info(`${stem}.svg`),
      ...(formats.pdf ? { pdf: info(`${stem}.pdf`) } : {}),
      png: formats.png.map((w) => info(`${stem}-${w}w.png`, w)),
      webp: formats.webp.map((w) => info(`${stem}-${w}w.webp`, w)),
    })),
  );
  return assets;
}

/**
 * The files of the package that can be downloaded from the site, by path in dist/.
 * @returns {string[]}
 */
export function identityFiles() {
  return identityAssets().flatMap((asset) =>
    [asset.svg, asset.pdf, ...asset.png, ...asset.webp].filter(Boolean).map((file) => file.path),
  );
}

/**
 * Absolute path of a file of dist/.
 * @param {string} rel
 */
export function identityFile(rel) {
  if (!identityFiles().includes(rel)) throw new Error(`Not a file of identity: ${rel}`);
  return path.join(distDir(), rel);
}

const order = (list, value) => {
  const i = list.indexOf(value);
  return i < 0 ? list.length : i;
};

/**
 * The artworks of a folder of dist/, by owner (the folder below it, if any:
 * avatar/ holds the avatars of every owner) and family, sorted by name.
 * @param {string} group
 * @returns {IdentityOwner[]}
 */
export function identityGroup(group) {
  const ownerNames = new Map(identityManifest().map(({ owner }) => [owner.id, owner.name]));
  /** @type {Map<string, IdentityOwner>} */
  const owners = new Map();
  for (const entry of identityManifest()) {
    if (entry.group !== group) continue;
    const list = identityAssets().filter((asset) => asset.family === entry.id);
    const [, ownerId = ''] = list[0]?.dir.split('/') ?? [];
    if (!owners.has(ownerId)) {
      owners.set(ownerId, { id: ownerId, name: ownerNames.get(ownerId) ?? ownerId, families: [] });
    }
    list.sort(
      (a, b) =>
        order(FORMS, a.form) - order(FORMS, b.form) ||
        order(COLORS, a.color) - order(COLORS, b.color),
    );
    owners.get(ownerId)?.families.push({
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      group,
      owner: entry.owner.name,
      forms: [...new Set(list.flatMap((asset) => (asset.form ? [asset.form] : [])))],
      assets: list,
    });
  }
  const list = [...owners.values()];
  for (const owner of list) owner.families.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  return list;
}

/**
 * How many artworks and files each folder of dist/ holds, for the landing page.
 * @param {string} group
 */
export function identityGroupCount(group) {
  const list = identityAssets().filter((asset) => asset.dir.split('/')[0] === group);
  return {
    artworks: list.length,
    files: list.reduce(
      (sum, asset) => sum + 1 + (asset.pdf ? 1 : 0) + asset.png.length + asset.webp.length,
      0,
    ),
  };
}

/** The folders of dist/ that IDENTITY_GROUPS does not list: a new folder needs a page. */
export function unknownIdentityGroups() {
  const known = new Set(IDENTITY_GROUPS.map(({ id }) => id));
  return [...new Set(identityManifest().map(({ group }) => group))].filter(
    (group) => !known.has(group),
  );
}
