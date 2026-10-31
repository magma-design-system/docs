// The pages of the domains of the design language, under Foundation: their
// address, and the domain of an address (src/loaders/domains.ts gives the data).
import { localePrefix } from './frame';
import { DOMAINS } from './nav.mjs';

const IDS = new Set(DOMAINS.map(({ id }) => id));

/** The id of the heading of the group Composition on the landing page of Foundation. */
export const COMPOSITION = 'composition';

export function domainHref(locale: string | undefined, id: string): string {
  return `${localePrefix(locale)}/foundation/${id}/`;
}

/** The id of the domain of a page URL, `undefined` for any other page. */
export function parseDomainPath(pathname: string, locale: string | undefined) {
  const prefix = `${localePrefix(locale)}/foundation/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const [id, rest] = pathname.slice(prefix.length).split('/');
  return id && IDS.has(id) && !rest ? id : undefined;
}
