// Who wrote a commit, for the page footer (src/components/frame/Footer.astro)
// and for its check in CI (scripts/check-authors.mjs): the GitHub login of the
// commit's author, the key of src/content/authors.json. A login comes from one
// of the emails an entry lists, or from GitHub's noreply email, which carries
// it: commits made with it (in GitHub's web editor, for one) need no email in
// authors.json.

/** The path of the people who write the pages, from the project root. */
export const AUTHORS_FILE = 'src/content/authors.json';

/**
 * `<id>+<login>@users.noreply.github.com`, or `<login>@...` for accounts older
 * than July 2017.
 */
const NOREPLY = /^(?:\d+\+)?([^@+]+)@users\.noreply\.github\.com$/i;

/**
 * @typedef {{ name: string, role: string, emails?: string[] }} Author
 *   An entry of authors.json.
 */

/** The GitHub login in a noreply email, lowercase; undefined for any other email. */
export function noreplyLogin(/** @type {string} */ email) {
  return NOREPLY.exec(email)?.[1].toLowerCase();
}

/**
 * Who wrote a commit, by the entries of authors.json (keyed by GitHub login):
 * the function returns the login of an author email, lowercase, from the
 * emails of the entries first and then from a noreply email, and the entry of
 * that login. The login is undefined for an email of no entry that is not a
 * noreply one; the entry is undefined for a login authors.json lacks.
 * @template {Author} T
 * @param {Iterable<readonly [string, T]>} authors
 */
export function authorResolver(authors) {
  /** @type {Map<string, T>} */
  const byLogin = new Map();
  /** @type {Map<string, string>} */
  const loginByEmail = new Map();
  for (const [login, author] of authors) {
    byLogin.set(login.toLowerCase(), author);
    for (const email of author.emails ?? []) {
      loginByEmail.set(email.toLowerCase(), login.toLowerCase());
    }
  }
  return (/** @type {string} */ email) => {
    const login = loginByEmail.get(email.toLowerCase()) ?? noreplyLogin(email);
    return { login, author: login === undefined ? undefined : byLogin.get(login) };
  };
}
