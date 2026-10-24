// @ts-check
// Magma's lint on the site's templates (agents/lint.md of the magma package):
// the rules read the API and the tokens of the installed Magma.
import htmlParser from '@html-eslint/parser';
import magma from '@maggioli-design-system/magma/eslint';
import * as astroParser from 'astro-eslint-parser';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/', '.astro/', 'public/'] },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.astro'] },
    },
    ...magma.configs.strict,
  },
  {
    files: ['**/*.html'],
    languageOptions: { parser: htmlParser },
    ...magma.configs.strict,
  },
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: { parser: tseslint.parser },
    ...magma.configs.strict,
  },
];
