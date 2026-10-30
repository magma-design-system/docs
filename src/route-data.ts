// Starlight's route middleware (`routeMiddleware` in astro.config.mjs): what
// Starlight computes for a page, changed before the page is drawn.
//
// The landing pages of Patterns and Building blocks: the gallery
// (PatternGallery.astro) draws a heading for each topic, which Markdown does
// not know. They go in the table of contents after the overview, where the
// gallery stands, right after the introduction.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { galleryGroups } from './lib/patterns';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const groups = galleryGroups(route, context.url.pathname);
  if (!route.toc || groups.length === 0) return;
  route.toc.items.splice(
    1,
    0,
    ...groups.map(({ slug, label }) => ({ depth: 2, slug, text: label, children: [] })),
  );
});
