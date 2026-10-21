// The light previews of the covers of public/covers/ shown by the Media kit
// (MediaKit.astro): a WebP 800 pixels wide each, the top of a screenshot, so
// the page does not load the full images (the screenshots weigh megabytes).
// /covers/previews/<path>.webp (src/lib/covers.mjs).
import type { APIRoute } from 'astro';
import { coverFiles, coverPreview, previewPath } from '../../../lib/covers.mjs';

export function getStaticPaths() {
  return coverFiles().map((file) => ({
    params: { file: previewPath(file).replace(/^previews\//, '') },
    props: { file },
  }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await coverPreview(props.file)), {
    headers: { 'Content-Type': 'image/webp' },
  });
