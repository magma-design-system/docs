// Changes to Starlight's data of a page, before it renders.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { patternGroups } from './lib/nav.mjs';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  if (!route.toc) return;
  const { t } = context.locals;
  const page = route.entry.id.replace(/^it\//, '');
  // The landing pages of Patterns and Building blocks: the gallery
  // (PatternGallery.astro) writes a heading per topic, right after the
  // introduction, before the first heading of the page.
  if (page === 'patterns' || page === 'blocks') {
    const kind = page === 'patterns' ? 'pattern' : 'block';
    const first = route.toc.items.findIndex((item) => item.slug !== '_top');
    route.toc.items.splice(
      first < 0 ? route.toc.items.length : first,
      0,
      ...patternGroups(kind).map((group) => ({
        depth: 2,
        slug: group.id,
        text: t(`nav.${page}.${group.id}` as any),
        children: [],
      })),
    );
  }
});
