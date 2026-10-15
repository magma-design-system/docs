// The icons of a set for its page (src/components/IconSet.astro), which loads
// them once it shows: /icons/<set>.json, the same for every language. Compact:
// each icon is [name, indexes of its categories, keywords joined by spaces].
import type { APIRoute } from 'astro';
import { ICON_SETS, iconSet, type IconSetId } from '../../lib/icons.mjs';

export function getStaticPaths() {
  return ICON_SETS.map((set) => ({ params: { set } }));
}

export const GET: APIRoute = ({ params }) => {
  const { categories, icons } = iconSet(params.set as IconSetId);
  const index = new Map(categories.map(({ id }, i) => [id, i]));
  const body = {
    categories: categories.map(({ id }) => id),
    icons: icons.map(({ name, categories: ids, keywords }) => [
      name,
      ids.map((id) => index.get(id)),
      keywords.join(' '),
    ]),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
