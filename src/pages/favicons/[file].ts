// The favicons of the site, drawn from the Magma mark of
// @maggioli-design-system/identity, the one of the frame (Logo.astro):
// /favicons/<file>, the same for every language, linked from the <head> of
// every page (astro.config.mjs). The SVG for browser tabs, white on a dark
// scheme as the mark of the frame; the ICO for the browsers without SVG
// favicons; the touch icon for the home screen of iOS and iPadOS; the manifest
// and its icons for Android and the installed apps.
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { identityFile } from '../../lib/identity.mjs';

const LOGO = 'internal/magma-design-system/logo-magma.svg';

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = '#ffffff';

/** The mark, `size` pixels wide, in the middle of a `canvas` square, transparent or on `background`. */
async function png(canvas: number, size = canvas, background?: string) {
  // Drawn at four times the size and scaled down: smoother edges.
  const mark = await sharp(readFileSync(identityFile(LOGO)), { density: (72 * 4 * size) / 200 })
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .toBuffer();
  return sharp({
    create: { width: canvas, height: canvas, channels: 4, background: background ?? TRANSPARENT },
  })
    .composite([{ input: mark }])
    .png()
    .toBuffer();
}

/** An ICO of PNG images, one per size. */
async function ico(sizes: number[]) {
  const images = await Promise.all(sizes.map((size) => png(size)));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((image, i) => {
    const entry = 6 + 16 * i;
    // 0 stands for 256.
    header.writeUInt8(sizes[i] % 256, entry);
    header.writeUInt8(sizes[i] % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  return Buffer.concat([header, ...images]);
}

/** The mark of logo-magma.svg, with the color of logo-magma-white.svg on a dark scheme. */
function svg() {
  return readFileSync(identityFile(LOGO), 'utf8').replace(
    /<svg[^>]*>/,
    (tag) => `${tag}<style>@media (prefers-color-scheme: dark) { path { fill: ${WHITE} } }</style>`,
  );
}

/** Paths relative to the manifest, which is in the same folder. */
const manifest = {
  name: 'Magma Design System',
  short_name: 'Magma',
  description: 'Maggioli Group Design System',
  start_url: '../',
  background_color: WHITE,
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

// The icons of the manifest leave a margin of 1/12 around the mark; the
// maskable one keeps it in the middle half, inside the safe zone of the masks
// (a circle 80% wide). iOS fills the transparent pixels of the touch icon with
// black: it is on white.
const FILES: Record<string, { type: string; body: () => string | Promise<Buffer> }> = {
  'favicon.svg': { type: 'image/svg+xml', body: svg },
  'favicon.ico': { type: 'image/x-icon', body: () => ico([16, 32, 48]) },
  'apple-touch-icon.png': { type: 'image/png', body: () => png(180, 120, WHITE) },
  'icon-192.png': { type: 'image/png', body: () => png(192, 160) },
  'icon-512.png': { type: 'image/png', body: () => png(512, 427) },
  'icon-maskable-512.png': { type: 'image/png', body: () => png(512, 256, WHITE) },
  'manifest.webmanifest': {
    type: 'application/manifest+json',
    body: () => JSON.stringify(manifest),
  },
};

export function getStaticPaths() {
  return Object.keys(FILES).map((file) => ({ params: { file } }));
}

export const GET: APIRoute = async ({ params }) => {
  const file = FILES[params.file ?? ''];
  const body = await file.body();
  return new Response(typeof body === 'string' ? body : new Uint8Array(body), {
    headers: { 'Content-Type': file.type },
  });
};
