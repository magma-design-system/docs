// The pages of the Brand assets section (src/pages/[...locale]/brand/[group]/[...owner].astro):
// one page per folder of the identity package, in the section nav; when the
// folder has more than one owner (the folder below it: a company, a brand),
// the page shows the first one and every other owner has a page of its own,
// /brand/<page>/<owner>/, listed in the "Brands" column of the frame
// (DocsNav.astro), as the categories of an icon set are.
import { localePrefix } from './frame';
import { IDENTITY_GROUPS, identityGroup, type IdentityOwner } from './identity.mjs';

/** The owners of a group with a page of their own: none when the group has one. */
export function brandOwners(group: string): IdentityOwner[] {
  const owners = identityGroup(group);
  return owners.length > 1 ? owners : [];
}

/** The URL of an owner of a group; the first owner is the page of the group. */
export function brandOwnerHref(locale: string | undefined, page: string, owner?: string): string {
  const group = IDENTITY_GROUPS.find((g) => g.page === page);
  const first = group && brandOwners(group.id)[0]?.id;
  const segment = owner && owner !== first ? `${owner}/` : '';
  return `${localePrefix(locale)}/brand/${page}/${segment}`;
}

/** Group, page and owner of a page of the section, `undefined` for any other page. */
export function parseBrandPath(pathname: string, locale: string | undefined) {
  const prefix = `${localePrefix(locale)}/brand/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const [page, owner] = pathname.slice(prefix.length).split('/');
  const group = IDENTITY_GROUPS.find((g) => g.page === page);
  if (!group) return undefined;
  const owners = brandOwners(group.id);
  return { group: group.id, page, owner: owner || owners[0]?.id, owners };
}
