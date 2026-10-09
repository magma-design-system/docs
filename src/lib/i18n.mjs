// Locales of the site and access to the UI dictionaries.
// UI strings live in src/content/i18n/<lang>.json, one file per locale, never in
// components. Pages read them through Starlight (`Astro.locals.t`); this module
// covers the code that runs before Starlight, like the sidebar in astro.config.mjs.
// To add a locale: one entry below plus src/content/i18n/<lang>.json. Missing
// strings and pages fall back to English.
import { readFileSync } from 'node:fs';

/** English at the site root, every other locale under `/<key>/`. */
export const locales = {
  root: { label: 'English', lang: 'en' },
  it: { label: 'Italiano', lang: 'it' },
};

/** Value of a `[...locale]` route param for each locale: `undefined` is the root. */
export const localeParams = Object.keys(locales).map((key) => (key === 'root' ? undefined : key));

const [defaultLang, ...otherLangs] = Object.values(locales).map(({ lang }) => lang);

/** @type {Record<string, Record<string, string>> | undefined} */
let dictionaries;

/**
 * Read on first use, not at import: pages import this module for
 * `localeParams` and, once bundled, `import.meta.url` no longer points at src/.
 */
function loadDictionaries() {
  dictionaries ??= Object.fromEntries(
    [defaultLang, ...otherLangs].map((lang) => [
      lang,
      JSON.parse(readFileSync(new URL(`../content/i18n/${lang}.json`, import.meta.url), 'utf8')),
    ]),
  );
  return dictionaries;
}

/**
 * A UI string as Starlight's sidebar config expects it: `label` in the default
 * language, `translations` for the locales that have one.
 * @param {string} key
 */
export function sidebarLabel(key) {
  const dictionaries = loadDictionaries();
  const label = dictionaries[defaultLang][key];
  if (!label) throw new Error(`Missing UI string "${key}" in src/content/i18n/${defaultLang}.json`);
  /** @type {Record<string, string>} */
  const translations = {};
  for (const lang of otherLangs) {
    if (dictionaries[lang][key]) translations[lang] = dictionaries[lang][key];
  }
  return { label, translations };
}
