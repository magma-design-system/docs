// The files of design-tokens offered for download on the Figma page of the
// Tokens section (src/components/FigmaDownloads.astro), copied as they are
// from node_modules: /downloads/<file>, the same for every language.
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { FIGMA_FILES, figmaFile } from '../../lib/tokens.mjs';

export function getStaticPaths() {
  return FIGMA_FILES.map(({ file }) => ({ params: { file } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(readFileSync(figmaFile(params.file ?? '')), {
    headers: { 'Content-Type': 'application/json' },
  });
