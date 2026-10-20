// Every author the page footers show is in src/content/authors.json, with a
// name and a role (layout decision 2 in plan/CONTENT_STRUCTURE.md). The footer
// reads the editorial commits of each page (src/lib/history.mjs) and finds
// their authors by GitHub login (src/lib/authors.mjs); this script does the
// same for every page and fails on an author it cannot find, saying what to
// add. CI runs it on every pull request, so nothing is published with an
// unknown author; the report also goes to the job summary on GitHub.
//
//   npm run check:authors
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { AUTHORS_FILE, authorResolver } from '../src/lib/authors.mjs';
import { isShallow, pageHistory } from '../src/lib/history.mjs';

const PAGES = 'src/content/docs';
/** GitHub logins: letters, digits and hyphens, up to 39, not starting with a hyphen. */
const LOGIN = /^[a-z0-9][a-z0-9-]{0,38}$/i;
const PLACEHOLDER = '<github-login>';

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

/** @type {Record<string, import('../src/lib/authors.mjs').Author>} */
const entries = JSON.parse(readFileSync(AUTHORS_FILE, 'utf8'));
const authorOf = authorResolver(Object.entries(entries));

// Entries that cannot show up right in a footer.
const invalid = Object.entries(entries).flatMap(([login, { name, role }]) => {
  const faults = [
    !LOGIN.test(login) && 'the key is not a GitHub login',
    !name?.trim() && 'no name',
    !role?.trim() && 'no role',
  ].filter(Boolean);
  return faults.length > 0 ? [`- \`"${login}"\`: ${faults.join(', ')}`] : [];
});

const pages = readdirSync(PAGES, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => path.posix.join(PAGES, file.split(path.sep).join('/')))
  .sort();

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
    if (author) {
      known.add(login);
      continue;
    }
    const key = login ?? email;
    const missing = unknown.get(key) ?? { login, name, email, pages: new Set() };
    missing.pages.add(page);
    unknown.set(key, missing);
  }
}

if (unknown.size === 0 && invalid.length === 0) {
  report(
    `## Page footer authors\n\nEvery author of the ${withHistory} pages is in ` +
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
    `Add them to \`${AUTHORS_FILE}\` in the same pull request: paste these entries inside its ` +
      'outer braces (entries are separated by commas) and write each role, the job title ' +
      'shown under the name.',
    `\`\`\`json\n${snippet}\n\`\`\``,
  );
  if (missing.some(({ login }) => !login)) {
    sections.push(
      `Replace \`${PLACEHOLDER}\` with the GitHub login of the person. If they are already in ` +
        'the file, add the email to the `emails` of their entry instead.',
    );
  }
}

if (invalid.length > 0) {
  sections.push(`Entries to fix in \`${AUTHORS_FILE}\`:`, invalid.join('\n'));
}

report(sections.join('\n\n'), true);
process.exit(1);
