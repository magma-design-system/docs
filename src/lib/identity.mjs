// The brand assets of @maggioli-design-system/identity, for the Brand assets
// section: every artwork of dist/ (one SVG each, with its PDF and its PNG and
// WebP renderings), grouped as the pages show them. One page per folder of
// dist/ (IDENTITY_GROUPS), one heading per owner (the folder below it), one
// family per brand or product, one tile per artwork of the family.
//
// The package ships the files only: no names, no descriptions, no usage
// rules. The names below are read from the artworks themselves and the
// descriptions are written by the pages from the kind of family; both are
// this site's defaults until the package publishes its own.
import { readdirSync, readFileSync, statSync } from 'node:fs';
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

/** The widths the package renders PNG and WebP files at, in pixels. */
export const RASTER_WIDTHS = [256, 512, 1024];

/** Names of the owner folders, in the order of the pages. */
const OWNERS = {
  'gruppo-maggioli': 'Gruppo Maggioli',
  'maggioli-academy': 'Maggioli Academy',
  'maggioli-editore': 'Maggioli Editore',
  'maggioli-informatica': 'Maggioli Informatica',
  'magma-design-system': 'Magma Design System',
  rnd: 'Maggioli R&D',
};

/** Names of the families, as the artworks write them. */
const NAMES = {
  'appalti-contratti': 'Appalti & Contratti',
  argo: 'Argo',
  'bilancio-contabilita': 'Bilancio e Contabilità',
  'city-mat-flussi-di-carico': 'City MAT Flussi di Carico',
  'city-mat-gestione-entrate': 'City MAT Gestione Entrate',
  'city-mat-ottico-web': 'City MAT OtticoWeb',
  'city-mat-pago-net': 'City MAT PagoNet',
  'city-mat-risco-net': 'City MAT RiscoNet',
  'city-mat-sori-net': 'City MAT SoriNet',
  'city-mat-suite': 'City MAT Suite',
  'contenuti-aggiuntivi': 'Contenuti aggiuntivi',
  ediliziaurbanistica: 'Edilizia Urbanistica',
  'forum-cantiere-innovazione': 'Forum Cantiere Innovazione',
  'gruppo-maggioli': 'Gruppo Maggioli',
  'ilibro-intelligente': 'iLibro intelligente',
  ilpersonale: 'ilpersonale.it',
  'la-gazzetta-degli-enti-locali': 'La Gazzetta degli Enti Locali',
  'la-polizia-locale': 'La Polizia Locale',
  'maggioli-academy': 'Maggioli Academy',
  'maggioli-editore': 'Maggioli Editore',
  magma: 'Magma',
  'norme-pa': 'Norme PA',
  'periodici-maggioli': 'Periodici Maggioli',
  polizialocale: 'PoliziaLocale.com',
  'rnd-build': 'R&D Build',
  'rnd-days': 'R&D Days',
  'rnd-dept': 'R&D Dept',
  'servizi-demografici': 'Servizi Demografici',
  'ufficio-commercio': 'Ufficio Commercio',
  'ufficio-tecnico': "L'Ufficio Tecnico",
  'ufficio-tributi': 'Ufficio Tributi',
};

/** Files whose name differs from the rest of their family. */
const FAMILY_ALIASES = { intelligente: 'ilibro-intelligente' };

/** Families with no `logo-` prefix that are pictures, not logos. */
const ILLUSTRATIONS = new Set(['norme-pa', 'periodici-maggioli']);

/** Color variants, in the order of the tiles; no suffix is `color`. */
export const COLORS = ['color', 'blue', 'gold', 'dark-gold', 'black', 'white'];
/** Forms of a family, in the order of the tiles. */
export const FORMS = ['logo', 'bordered', 'symbol'];

const COLOR_SUFFIX = /-(dark-gold|gold|blue|black|white)(?=-|$)/;

/** The installed dist/ folder of the package. */
function distDir() {
  return path.dirname(resolveMagma('identity/dist/directory-tree.json'));
}

/** Readable name of a slug with no entry in NAMES: `ufficio-tributi` -> `Ufficio Tributi`. */
function humanize(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** What a file name says about its artwork: family, form and color. */
function parseName(stem, group) {
  let rest = stem;
  let form = 'logo';
  const prefix = /^(logo|icon|avatar)-/.exec(rest)?.[1];
  if (prefix) rest = rest.slice(prefix.length + 1);
  if (prefix === 'icon') form = 'symbol';
  const color = COLOR_SUFFIX.exec(rest)?.[1] ?? 'color';
  rest = rest.replace(COLOR_SUFFIX, '');
  if (/-no-text$/.test(rest)) {
    form = 'symbol';
    rest = rest.replace(/-no-text$/, '');
  } else if (/-icon$/.test(rest)) {
    form = 'symbol';
    rest = rest.replace(/-icon$/, '');
  } else if (/-bordered$/.test(rest)) {
    form = 'bordered';
    rest = rest.replace(/-bordered$/, '');
  }
  const family = FAMILY_ALIASES[rest] ?? rest;
  const kind =
    group === 'avatar'
      ? 'avatar'
      : group === 'illustrations' || ILLUSTRATIONS.has(family)
        ? 'illustration'
        : 'logo';
  return { family, form, color, kind };
}

/** Whether a file holds PNG data, whatever its extension. */
function isPng(file) {
  const head = readFileSync(file).subarray(0, 8);
  return head.toString('hex') === '89504e470d0a1a0a';
}

/** Width and height of an SVG, from its viewBox. */
function svgSize(file) {
  const box = /viewBox="([^"]+)"/.exec(readFileSync(file, 'utf8'))?.[1];
  const [, , width, height] = (box ?? '').split(/[\s,]+/).map(Number);
  return { width: width || 0, height: height || 0 };
}

/**
 * @typedef {{ file: string, path: string, bytes: number, width?: number }} IdentityFile
 * @typedef {{
 *   stem: string, dir: string, family: string, kind: string, form: string, color: string,
 *   width: number, height: number,
 *   svg: IdentityFile, pdf?: IdentityFile, png: IdentityFile[], webp: IdentityFile[],
 * }} IdentityAsset
 * @typedef {{
 *   id: string, name: string, kind: string, group: string, owner?: string,
 *   forms: string[], assets: IdentityAsset[],
 * }} IdentityFamily
 * @typedef {{ id: string, name: string, families: IdentityFamily[] }} IdentityOwner
 */

let assets;

/** Every artwork of the package, one per SVG, with its other files. */
export function identityAssets() {
  if (assets) return assets;
  const dist = distDir();
  /** @type {string[]} */
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name);
      if (statSync(file).isDirectory()) walk(file);
      else files.push(path.relative(dist, file).split(path.sep).join('/'));
    }
  };
  walk(dist);
  const all = new Set(files);
  const info = (rel, width) => ({
    file: path.posix.basename(rel),
    path: rel,
    bytes: statSync(path.join(dist, rel)).size,
    ...(width ? { width } : {}),
  });
  const rasters = (stem, ext) =>
    RASTER_WIDTHS.filter((width) => all.has(`${stem}-${width}w.${ext}`)).map((width) =>
      info(`${stem}-${width}w.${ext}`, width),
    );
  assets = files
    .filter((rel) => rel.endsWith('.svg'))
    .sort()
    .map((rel) => {
      const stem = rel.slice(0, -'.svg'.length);
      const dir = path.posix.dirname(rel);
      return {
        stem: path.posix.basename(stem),
        dir,
        ...parseName(path.posix.basename(stem), dir.split('/')[0]),
        ...svgSize(path.join(dist, rel)),
        svg: info(rel),
        ...(all.has(`${stem}.pdf`) ? { pdf: info(`${stem}.pdf`) } : {}),
        png: rasters(stem, 'png'),
        webp: rasters(stem, 'webp'),
      };
    });
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

/**
 * Whether the WebP files of the package hold PNG data: the build of identity
 * up to 2.1.1 writes the same PNG under both extensions.
 */
export function webpIsPng() {
  const webp = identityAssets().find((asset) => asset.webp.length)?.webp[0];
  return webp ? isPng(identityFile(webp.path)) : false;
}

const order = (list, value) => {
  const i = list.indexOf(value);
  return i < 0 ? list.length : i;
};

/**
 * The artworks of a folder of dist/, by owner (the folder below it, if any)
 * and family, sorted by name.
 * @param {string} group
 * @returns {IdentityOwner[]}
 */
export function identityGroup(group) {
  /** @type {Map<string, IdentityOwner>} */
  const owners = new Map();
  /** @type {Map<string, IdentityFamily>} */
  const families = new Map();
  for (const asset of identityAssets()) {
    const [top, ownerId = ''] = asset.dir.split('/');
    if (top !== group) continue;
    const { family, kind } = asset;
    if (!owners.has(ownerId)) {
      owners.set(ownerId, {
        id: ownerId,
        name: OWNERS[ownerId] ?? humanize(ownerId),
        families: [],
      });
    }
    const key = `${ownerId}/${family}`;
    if (!families.has(key)) {
      const entry = {
        id: family,
        name: NAMES[family] ?? humanize(family),
        kind,
        group,
        ...(ownerId ? { owner: owners.get(ownerId)?.name } : {}),
        forms: [],
        assets: [],
      };
      families.set(key, entry);
      owners.get(ownerId)?.families.push(entry);
    }
    families.get(key)?.assets.push(asset);
  }
  for (const family of families.values()) {
    family.assets.sort(
      (a, b) =>
        order(FORMS, a.form) - order(FORMS, b.form) ||
        order(COLORS, a.color) - order(COLORS, b.color),
    );
    family.forms = [...new Set(family.assets.map((asset) => asset.form))];
  }
  const byName = (a, b) => a.name.localeCompare(b.name, 'en');
  const known = Object.keys(OWNERS);
  const list = [...owners.values()].sort(
    (a, b) => order(known, a.id) - order(known, b.id) || byName(a, b),
  );
  for (const owner of list) owner.families.sort(byName);
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
  return [...new Set(identityAssets().map((asset) => asset.dir.split('/')[0]))].filter(
    (group) => !known.has(group),
  );
}
