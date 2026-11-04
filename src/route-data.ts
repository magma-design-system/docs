// Changes to Starlight's data of a page, before it renders.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { patternGroups, shippedDomains } from './lib/nav.mjs';
import { COMPOSITION } from './lib/patterns';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  if (!route.toc) return;
  const { t } = context.locals;
  const page = route.entry.id.replace(/^it\//, '');
  // The landing page of Foundation: the group Composition is written by a
  // component (DomainCards.astro), only when the installed magma ships the
  // domains, so Starlight does not see its heading. List it after Design, as
  // the page shows it.
  if (page === 'foundation') {
    if (!shippedDomains().length) return;
    const after = route.toc.items.findIndex((item) => item.slug === 'design');
    if (after < 0) throw new Error('The landing page of Foundation has no heading "design"');
    route.toc.items.splice(after + 1, 0, {
      depth: 2,
      slug: COMPOSITION,
      text: t('nav.foundation.composition'),
      children: [],
    });
  }
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
