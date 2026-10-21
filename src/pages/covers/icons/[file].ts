// The square avatar of Magma for the profiles on social networks and chats,
// drawn from avatar/avatar-magma.svg of @maggioli-design-system/identity
// (src/lib/covers.mjs): the mark on white, inside the circle most profiles crop
// to. /covers/icons/<file>, next to the covers of public/covers/, one size per
// use (agents/architecture.md, Covers). The icons of the site itself (iOS,
// Android, browsers) are in src/pages/favicons/[file].ts.
import type { APIRoute } from 'astro';
import { AVATAR_SIZES, avatarPng } from '../../../lib/covers.mjs';

export function getStaticPaths() {
  return AVATAR_SIZES.map((size) => ({
    params: { file: `avatar-${size}x${size}.png` },
    props: { size },
  }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await avatarPng(props.size)), {
    headers: { 'Content-Type': 'image/png' },
  });
