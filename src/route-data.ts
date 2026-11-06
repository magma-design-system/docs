// Changes to Starlight's data of a page, before it renders.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { COMPOSITION } from './lib/domains';
import { shippedDomains } from './lib/nav.mjs';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  // The landing page of Foundation: the group Composition is written by a
  // component (DomainCards.astro), only when the installed magma ships the
  // domains, so Starlight does not see its heading. List it after Design, as
  // the page shows it.
  if (route.entry.id.replace(/^it\//, '') !== 'foundation' || !route.toc) return;
  if (!shippedDomains().length) return;
  const after = route.toc.items.findIndex((item) => item.slug === 'design');
  if (after < 0) throw new Error('The landing page of Foundation has no heading "design"');
  route.toc.items.splice(after + 1, 0, {
    depth: 2,
    slug: COMPOSITION,
    text: context.locals.t('nav.foundation.composition'),
    children: [],
  });
});
