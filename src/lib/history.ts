// Who created a page and who modified it last, and when: the git history of its
// source file (layout decision 2 in plan/CONTENT_STRUCTURE.md). The page footer
// (src/components/frame/Footer.astro) adds the roles of src/content/authors.json.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export interface Commit {
  date: Date;
  /** Author name, after .mailmap. */
  name: string;
  /** Author email, lowercase: the key of src/content/authors.json. */
  email: string;
}

export interface PageHistory {
  modified: Commit;
  created: Commit;
}

const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8' });

let shallow: boolean | undefined;

/**
 * The deploy workflow fetches the whole history (`fetch-depth: 0`). In a
 * shallow clone the oldest fetched commit seems to add every file: it would
 * show up as both creation and last change of every page not changed since.
 */
function isShallow(): boolean {
  if (shallow === undefined) {
    shallow = git(['rev-parse', '--is-shallow-repository']).stdout.trim() === 'true';
    if (shallow) {
      console.warn('[history] shallow clone: page footers leave out the authors.');
    }
  }
  return shallow;
}

/**
 * History of a source file, by its path from the project root (the working
 * directory of Astro), following renames. Undefined for a page without a
 * source file (the component pages, generated from Magma), a file not
 * committed yet, without git or in a shallow clone.
 */
export function pageHistory(filePath: string): PageHistory | undefined {
  if (!existsSync(filePath) || isShallow()) return undefined;
  const log = git(['log', '--follow', '--format=%aI%x1f%aN%x1f%aE', '--', filePath]);
  if (log.status !== 0) return undefined;
  const commits = log.stdout
    .split('\n')
    .filter(Boolean)
    .map((line): Commit => {
      const [date, name, email] = line.split('\x1f');
      return { date: new Date(date), name, email: email.toLowerCase() };
    });
  if (commits.length === 0) return undefined;
  return { modified: commits[0], created: commits.at(-1)! };
}
