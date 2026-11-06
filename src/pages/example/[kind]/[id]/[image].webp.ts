// The images of the previews of the domains of the design language, the
// patterns and the building blocks, light and dark, copied as Magma ships them
// (previewImage() in src/lib/magma.mjs), beside the page that runs each
// preview ([preview].astro): /docs/example/<domain, pattern or block>/<id>/
// <preview>.<light or dark>.webp (previewImageHref() in src/lib/patterns.ts).
// The cards of the galleries show them (PatternGallery.astro), where running
// the stage would load a whole page per card.
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { loadPatterns, PREVIEW_SCHEMES, previewImage } from '../../../../lib/magma.mjs';

export function getStaticPaths() {
  return loadPatterns().flatMap(({ id, kind, previews }) =>
    previews.flatMap((preview) =>
      PREVIEW_SCHEMES.map((scheme) => ({
        params: {
          kind: kind === 'design-language' ? 'domain' : kind,
          id,
          image: `${preview.id}.${scheme}`,
        },
        props: { file: previewImage(id, preview.id, scheme) },
      })),
    ),
  );
}

export const GET: APIRoute = ({ props }) =>
  new Response(readFileSync(props.file), { headers: { 'Content-Type': 'image/webp' } });
