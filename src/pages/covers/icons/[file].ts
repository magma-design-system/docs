// The square avatar of Magma for the profiles on social networks and chats,
// drawn from avatar/avatar-magma.svg of @maggioli-design-system/identity: the
// mark on white, inside the circle most profiles crop to. /covers/icons/<file>,
// next to the covers of public/covers/, one size per use (agents/architecture.md,
// Covers). The icons of the site itself (iOS, Android, browsers) are in
// src/pages/favicons/[file].ts.
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { identityFile } from '../../../lib/identity.mjs';

const AVATAR = 'avatar/avatar-magma.svg';

/**
 * The sizes, in pixels: 400 for X, LinkedIn and Mastodon; 512 for Slack,
 * Discord and GitHub; 800 for YouTube; 1024 for Bluesky and anything larger.
 */
const SIZES = [400, 512, 800, 1024];

/** Drawn at twice the size and scaled down, for smoother edges: the SVG is 500 wide. */
const png = (size: number) =>
  sharp(readFileSync(identityFile(AVATAR)), { density: (72 * 2 * size) / 500 })
    .resize(size, size)
    .png()
    .toBuffer();

export function getStaticPaths() {
  return SIZES.map((size) => ({ params: { file: `avatar-${size}x${size}.png` }, props: { size } }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await png(props.size)), {
    headers: { 'Content-Type': 'image/png' },
  });
