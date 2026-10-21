// The releases of the Magma packages, for the Changelog page of the Home
// section (src/content/docs/changelog.mdx, src/components/Changelog.astro):
// read from the CHANGELOG.md each package ships (magma#892; magma and its
// wrappers export it since 2.4.0, magma#981). Each section of the file is the
// body of the GitHub release with the same tag, written by git-cliff:
//
//   ## [magma@2.5.0] - 2026-10-21
//   ### Bug Fixes
//   - *(mds-card)* Keep the footer at the bottom of the card without a content
//   - *(stencil)* [**breaking**] Make the published packages tree-shakeable
//
// A line this module does not know fails the build: a new format must be
// looked at, not lost.
import { readFileSync } from 'node:fs';
import { resolveMagma } from './magma.mjs';

/**
 * Where the page starts: Magma 2. Every package from the day of this release
 * on, so the icon releases of July 2026, before Magma 2, are left out.
 */
const FIRST = { pkg: 'magma', version: '2.0.0' };

const RELEASE = /^## \[(?<tag>[^\]@]+@(?<version>[^\]]+))\] - (?<date>\d{4}-\d{2}-\d{2})$/;
const GROUP = /^### (?<name>.+)$/;
const ENTRY = /^- (?:\*\((?<scopes>[^)]+)\)\* )?(?<breaking>\[\*\*breaking\*\*\] )?(?<text>.+)$/;

/**
 * @typedef {{ scopes: string[], breaking: boolean, text: string, notes: string[] }} Entry
 * @typedef {{ name: string, entries: Entry[] }} Group
 * @typedef {{ tag: string, version: string, date: string, breaking: boolean, groups: Group[] }} Release
 */

/** @type {Map<string, Release[]>} */
const cache = new Map();

/**
 * Every release in the CHANGELOG.md of a package, newest first.
 * @param {string} pkg
 * @returns {Release[]}
 */
function allReleases(pkg) {
  const cached = cache.get(pkg);
  if (cached) return cached;
  const file = resolveMagma(`${pkg}/CHANGELOG.md`);
  /** @type {Release[]} */
  const releases = [];
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const [index, line] of lines.entries()) {
    const release = releases.at(-1);
    const group = release?.groups.at(-1);
    const heading = RELEASE.exec(line)?.groups;
    const groupName = GROUP.exec(line)?.groups?.name;
    const entry = ENTRY.exec(line)?.groups;
    if (heading) {
      const { tag, version, date } = heading;
      releases.push({ tag, version, date, breaking: false, groups: [] });
    } else if (!release || line.trim() === '') {
      // The title and the introduction of the file, blank lines.
    } else if (groupName) {
      release.groups.push({ name: groupName, entries: [] });
    } else if (entry && group) {
      const breaking = Boolean(entry.breaking);
      group.entries.push({
        scopes: entry.scopes ? entry.scopes.split(',') : [],
        breaking,
        text: entry.text,
        notes: [],
      });
      release.breaking ||= breaking;
    } else if (/^\s/.test(line) && group?.entries.length) {
      // An indented line belongs to the entry above it (a BREAKING CHANGE
      // footer, a body).
      group.entries.at(-1)?.notes.push(line.trim());
    } else {
      throw new Error(`${file}:${index + 1}: unexpected line in a release: ${line}`);
    }
  }
  cache.set(pkg, releases);
  return releases;
}

/**
 * The releases of a package that the page shows, newest first: those from the
 * day of Magma 2.0.0 on.
 * @param {string} pkg
 */
export function changelog(pkg) {
  const first = allReleases(FIRST.pkg).find(({ version }) => version === FIRST.version);
  if (!first) throw new Error(`${FIRST.pkg}@${FIRST.version} is not in its CHANGELOG.md`);
  return allReleases(pkg).filter(({ date }) => date >= first.date);
}
