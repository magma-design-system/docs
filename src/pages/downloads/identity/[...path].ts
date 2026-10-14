// The files of @maggioli-design-system/identity offered for download in the
// Brand assets section (src/components/IdentityFamily.astro), copied as they
// are from node_modules: /downloads/identity/<path in dist/>, the same for
// every language.
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { identityFile, identityFiles } from '../../../lib/identity.mjs';

const TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  png: 'image/png',
  webp: 'image/webp',
};

export function getStaticPaths() {
  return identityFiles().map((path) => ({ params: { path } }));
}

export const GET: APIRoute = ({ params }) => {
  const path = params.path ?? '';
  return new Response(readFileSync(identityFile(path)), {
    headers: { 'Content-Type': TYPES[path.split('.').pop() ?? ''] ?? 'application/octet-stream' },
  });
};
