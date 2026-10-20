// Every author the page footers show is in src/content/authors.json, with a
// name and a role (layout decision 2 in plan/CONTENT_STRUCTURE.md). The footer
// reads the editorial commits of each page (src/lib/history.mjs) and finds
// their authors by GitHub login (src/lib/authors.mjs); this script does the
// same and fails on an author it cannot find, saying what to add. The report
// also goes to the job summary on GitHub.
//
//   npm run check:authors                       every page
//   npm run check:authors -- --base origin/main the pages changed since main
//
// CI runs it with `--base` on every pull request, as a signal that never
// blocks a merge or a publication (agents/workflow.md): a pull request that
// changes no page, as Renovate's, always passes.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { AUTHORS_FILE, authorResolver } from '../src/lib/authors.mjs';
import { isShallow, pageHistory } from '../src/lib/history.mjs';

const PAGES = 'src/content/docs';
/** Like GitHub logins: letters, digits and hyphens, up to 39, not starting with a hyphen. */
const LOGIN = /^[a-z0-9][a-z0-9-]{0,38}$/i;
const PLACEHOLDER = '<github-login>';
const PAGE = /\.mdx?$/;

const { base } = parseArgs({ options: { base: { type: 'string' } } }).values;

/** Prints the report and adds it to the summary of the GitHub job, if any. */
function report(/** @type {string} */ markdown, failed = false) {
  (failed ? console.error : console.log)(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
}

if (isShallow()) {
  report(
    '## Page footer authors\n\nShallow clone: the authors of the pages are unknown. ' +
      'Fetch the whole history (`git fetch --unshallow`, or `fetch-depth: 0` in CI).',
    true,
  );
  process.exit(1);
}

/**
 * The files to check: every page, or with `--base` the pages and authors.json
 * as changed by the commits since the merge base (`<base>...HEAD`), deleted
 * ones left out.
 */
function changedFiles() {
  if (base === undefined) {
    return readdirSync(PAGES, { recursive: true, encoding: 'utf8' })
      .filter((file) => PAGE.test(file))
      .map((file) => path.posix.join(PAGES, file.split(path.sep).join('/')));
  }
  const diff = spawnSync(
    'git',
    ['diff', '--name-only', `${base}...HEAD`, '--', PAGES, AUTHORS_FILE],
    { encoding: 'utf8' },
  );
  if (diff.status !== 0) {
    report(`## Page footer authors\n\nNo diff against \`${base}\`:\n\n${diff.stderr}`, true);
    process.exit(1);
  }
  return diff.stdout.split('\n').filter((file) => file && existsSync(file));
}

const files = changedFiles();
const pages = files.filter((file) => PAGE.test(file)).sort();

/** @type {Record<string, import('../src/lib/authors.mjs').Author>} */
const entries = JSON.parse(readFileSync(AUTHORS_FILE, 'utf8'));
const authorOf = authorResolver(Object.entries(entries));

/**
 * Entries that cannot show up right in a footer, by login: every entry when
 * authors.json is checked, else the entries of the authors found.
 * @type {Map<string, string[]>}
 */
const invalid = new Map();
function validate(/** @type {string} */ login) {
  const { name, role } = entries[login];
  const faults = [
    !LOGIN.test(login) && 'the key is not a login (letters, digits, hyphens)',
    !name?.trim() && 'no name',
    !role?.trim() && 'no role',
  ].filter(Boolean);
  if (faults.length > 0) invalid.set(login, faults);
}
if (files.includes(AUTHORS_FILE) || base === undefined) Object.keys(entries).forEach(validate);
const keyOf = new Map(Object.keys(entries).map((key) => [key.toLowerCase(), key]));

/** Authors found, by login. */
const known = new Set();
/**
 * Authors missing from authors.json, by login or, without one, by email.
 * @type {Map<string, { login?: string, name: string, email: string, pages: Set<string> }>}
 */
const unknown = new Map();
let withHistory = 0;

for (const page of pages) {
  const history = pageHistory(page);
  if (!history) continue;
  withHistory += 1;
  for (const { name, email } of [history.modified, history.created]) {
    const { login, author } = authorOf(email);
    if (author && login) {
      known.add(login);
      validate(keyOf.get(login) ?? login);
      continue;
    }
    const key = login ?? email;
    const missing = unknown.get(key) ?? { login, name, email, pages: new Set() };
    missing.pages.add(page);
    unknown.set(key, missing);
  }
}

if (unknown.size === 0 && invalid.size === 0) {
  report(
    withHistory === 0
      ? `## Page footer authors\n\nNo page to check${base ? ` against \`${base}\`` : ''}.`
      : `## Page footer authors\n\nEvery author of the ${withHistory} ` +
          `${base === undefined ? '' : 'changed '}pages is in ` +
          `\`${AUTHORS_FILE}\`: ${[...known].join(', ')}.`,
  );
  process.exit(0);
}

const sections = ['## Page footer authors'];

if (unknown.size > 0) {
  const missing = [...unknown.values()].sort((a, b) => a.name.localeCompare(b.name));
  const snippet = missing
    .map(({ login, name, email }) =>
      JSON.stringify(
        { [login ?? PLACEHOLDER]: { name, role: '', ...(login ? {} : { emails: [email] }) } },
        null,
        2,
      )
        .split('\n')
        .slice(1, -1)
        .join('\n'),
    )
    .join(',\n');
  sections.push(
    `These authors of pages are not in \`${AUTHORS_FILE}\`, so the page footer would show ` +
      'their git name without a role:',
    missing
      .map(
        ({ login, name, email, pages }) =>
          `- ${name} <${email}>, GitHub login ${login ? `\`${login}\`` : 'unknown'}:\n` +
          [...pages].map((page) => `  - \`${page}\``).join('\n'),
      )
      .join('\n'),
    `This check does not block the merge. Add them to \`${AUTHORS_FILE}\`, in this pull ` +
      'request or in a later one: paste these entries inside its outer braces (entries are ' +
      'separated by commas) and write each role, the job title shown under the name. Their ' +
      'names and roles show up at the next publication, with no page to touch.',
    `\`\`\`json\n${snippet}\n\`\`\``,
  );
  if (missing.some(({ login }) => !login)) {
    sections.push(
      `Replace \`${PLACEHOLDER}\` with the GitHub login of the person. If they are already in ` +
        'the file, add the email to the `emails` of their entry instead.',
    );
  }
}

if (invalid.size > 0) {
  sections.push(
    `Entries to fix in \`${AUTHORS_FILE}\`:`,
    [...invalid].map(([login, faults]) => `- \`"${login}"\`: ${faults.join(', ')}`).join('\n'),
  );
}

report(sections.join('\n\n'), true);
process.exit(1);
