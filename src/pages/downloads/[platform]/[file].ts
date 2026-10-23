// The files of design-tokens offered for download on the Android, iOS and
// Flutter pages of the Tokens section (src/components/PlatformFiles.astro),
// copied as they are from node_modules: /downloads/<platform>/<file>, the same
// for every language.
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { PLATFORM_FILES, platformFile } from '../../../lib/tokens.mjs';

export function getStaticPaths() {
  return PLATFORM_FILES.map(({ platform, file }) => ({ params: { platform, file } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(readFileSync(platformFile(params.platform ?? '', params.file ?? '')), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
