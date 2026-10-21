// The covers of the site (agents/architecture.md, Covers): the images of
// public/covers/, made by hand and served as they are, and the avatar of Magma
// drawn from @maggioli-design-system/identity at the sizes of social profiles
// (src/pages/covers/icons/[file].ts). The Media kit page lists them
// (MediaKit.astro), each with a light preview (src/pages/covers/previews/).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { identityFile } from './identity.mjs';

/** Where the covers are, from the root of the repository. */
export const COVERS_DIR = 'public/covers';
/** Covers are PNG, as their names say (`<use>-<width>x<height>.png`). */
const IMAGE = /\.png$/i;

const AVATAR = 'avatar/avatar-magma.svg';
/**
 * The sizes of the avatar, in pixels: 400 for X, LinkedIn and Mastodon; 512
 * for Slack, Discord and GitHub; 800 for YouTube; 1024 for Bluesky and
 * anything larger (media.avatar.<size> in the UI dictionaries).
 */
export const AVATAR_SIZES = [400, 512, 800, 1024];

/** @type {Map<number, Promise<Buffer>>} */
const avatars = new Map();

/**
 * The avatar, `size` pixels square: drawn at twice the size and scaled down,
 * for smoother edges (the SVG is 500 wide). Once per size and build.
 * @param {number} size
 */
export function avatarPng(size) {
  let png = avatars.get(size);
  if (!png) {
    png = sharp(readFileSync(identityFile(AVATAR)), { density: (72 * 2 * size) / 500 })
      .resize(size, size)
      .png()
      .toBuffer();
    avatars.set(size, png);
  }
  return png;
}

/**
 * The images of public/covers/, as paths from it with `/`, sorted.
 * @returns {string[]}
 */
export function coverFiles() {
  return readdirSync(COVERS_DIR, { recursive: true, encoding: 'utf8' })
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => IMAGE.test(file))
    .sort();
}

/**
 * The groups of the Media kit, in their order: a cover goes to `screenshots`
 * in screenshots/, to `posts` if its name starts with post-, to `previews`
 * otherwise; `avatars` are generated.
 */
export const COVER_GROUPS = /** @type {const} */ (['previews', 'posts', 'avatars', 'screenshots']);

/** @typedef {(typeof COVER_GROUPS)[number]} CoverGroup */

/**
 * @typedef {object} Cover
 * @property {string} path From /covers/, the URL of the file.
 * @property {string} file Its name.
 * @property {string} use What it is for: the name before its size (`og`, `post`), or the name of a screenshot.
 * @property {number} width
 * @property {number} height
 * @property {number} bytes
 * @property {boolean} generated Drawn at build time: its preview is the file itself.
 */

/** @param {string} file */
const groupOf = (file) =>
  file.startsWith('screenshots/') ? 'screenshots' : file.startsWith('post-') ? 'posts' : 'previews';

/** The uses that come first among the previews, in this order; the others follow by name. */
const FIRST = ['og', 'github'];

/** @param {string} use */
const rank = (use) => (FIRST.includes(use) ? FIRST.indexOf(use) : FIRST.length);

/**
 * The covers of a group, with their sizes.
 * @param {CoverGroup} group
 * @returns {Promise<Cover[]>}
 */
export async function covers(group) {
  if (group === 'avatars') {
    return Promise.all(
      AVATAR_SIZES.map(async (size) => ({
        path: `icons/avatar-${size}x${size}.png`,
        file: `avatar-${size}x${size}.png`,
        use: 'avatar',
        width: size,
        height: size,
        bytes: (await avatarPng(size)).length,
        generated: true,
      })),
    );
  }
  const list = await Promise.all(
    coverFiles()
      .filter((file) => groupOf(file) === group)
      .map(async (file) => {
        const full = path.join(COVERS_DIR, file);
        const { width = 0, height = 0 } = await sharp(full, { limitInputPixels: false }).metadata();
        const name = path.posix.basename(file).replace(IMAGE, '');
        return {
          path: file,
          file: path.posix.basename(file),
          use: name.replace(/-\d+x\d+$/, ''),
          width,
          height,
          bytes: statSync(full).size,
          generated: false,
        };
      }),
  );
  // Light mode before dark mode, as the preferences list them.
  const key = (/** @type {string} */ file) =>
    file.replace(/-light\.png$/, '-0').replace(/-dark\.png$/, '-1');
  return list.sort((a, b) => rank(a.use) - rank(b.use) || key(a.path).localeCompare(key(b.path)));
}

/** How wide the previews of the Media kit are, in pixels: twice a card. */
const PREVIEW_WIDTH = 800;

/**
 * The preview of a cover of public/covers/, a WebP `PREVIEW_WIDTH` wide: the
 * top of a screenshot, 4:3, the whole image otherwise.
 * @param {string} file A path of coverFiles().
 */
export async function coverPreview(file) {
  const image = sharp(path.join(COVERS_DIR, file), { limitInputPixels: false });
  const { width = 0, height = 0 } = await image.metadata();
  const top = Math.min(height, Math.round((width * 3) / 4));
  return (
    groupOf(file) === 'screenshots' ? image.extract({ left: 0, top: 0, width, height: top }) : image
  )
    .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * The URL path of the preview of a cover, from /covers/.
 * @param {string} file
 */
export const previewPath = (file) => `previews/${file.replace(IMAGE, '.webp')}`;
