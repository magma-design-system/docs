// Who created a page and who modified it last, and when: the git history of its
// source file (layout decision 2 in plan/CONTENT_STRUCTURE.md), editorial
// commits only. The page footer (src/components/frame/Footer.astro) adds the
// names and roles of src/content/authors.json (src/lib/authors.mjs);
// scripts/check-authors.mjs checks in CI that every author has them.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * @typedef {{ date: Date, name: string, email: string }} Commit
 *   The author's name and email, after .mailmap; the email lowercase.
 * @typedef {{ modified: Commit, created: Commit }} PageHistory
 */

const git = (/** @type {string[]} */ args) => spawnSync('git', args, { encoding: 'utf8' });

/**
 * Commits that do not change what a page says: formatting, tooling, moves. A
 * subject that is not a Conventional Commit (GitHub's "Update page.md") is an
 * edit.
 */
const NOT_EDITORIAL = /^(?:style|build|chore|refactor|ci)(?:\([^)]*\))?!?:/i;

/** @type {boolean | undefined} */
let shallow;

/**
 * The deploy workflow fetches the whole history (`fetch-depth: 0`). In a
 * shallow clone the oldest fetched commit seems to add every file: it would
 * show up as both creation and last change of every page not changed since.
 */
export function isShallow() {
  if (shallow === undefined) {
    shallow = git(['rev-parse', '--is-shallow-repository']).stdout.trim() === 'true';
    if (shallow) {
      console.warn('[history] shallow clone: page footers leave out the authors.');
    }
  }
  return shallow;
}

/**
 * Whether a commit wrote the page: not a bot's, not a non-editorial type, not
 * a rename alone (`R100`: the content is the same).
 * @param {{ name: string, email: string, subject: string, status: string }} commit
 */
export function isEditorial({ name, email, subject, status }) {
  const bot = /\[bot\]$/i.test(name) || /\[bot\]@/i.test(email);
  return !bot && !NOT_EDITORIAL.test(subject) && status !== 'R100';
}

/**
 * History of a source file, by its path from the project root (the working
 * directory of Astro), following renames, merges left out. Undefined for a
 * page without a source file (the component pages, generated from Magma), a
 * file not committed yet or without editorial commits, without git or in a
 * shallow clone.
 * @param {string} filePath
 * @returns {PageHistory | undefined}
 */
export function pageHistory(filePath) {
  if (!existsSync(filePath) || isShallow()) return undefined;
  // One record per commit: the fields, then the status of the file
  // (`M`, `A`, `R100`, ...) on a line of its own.
  const log = git([
    'log',
    '--follow',
    '--no-merges',
    '--name-status',
    '--format=%x1e%aI%x1f%aN%x1f%aE%x1f%s',
    '--',
    filePath,
  ]);
  if (log.status !== 0) return undefined;
  const commits = log.stdout
    .split('\x1e')
    .filter(Boolean)
    .map((record) => {
      const [fields, ...files] = record.split('\n');
      const [date, name, email, subject] = fields.split('\x1f');
      const status = files.find(Boolean)?.split('\t')[0] ?? '';
      return { date: new Date(date), name, email: email.toLowerCase(), subject, status };
    })
    .filter(isEditorial)
    .map(({ date, name, email }) => ({ date, name, email }));
  if (commits.length === 0) return undefined;
  return { modified: commits[0], created: commits.at(-1) ?? commits[0] };
}
