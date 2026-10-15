// The patterns of the Patterns section: one folder per pattern in
// src/patterns/, with the same screen in each framework of FrameworkTabs:
// `example.html` (plain HTML; it is also the live preview, see
// src/pages/example/pattern/[id].astro), `react.tsx` and `angular.ts`. They are
// sample code for other projects, not code of this site: tsconfig.json leaves
// the framework ones out of the type check.

const sources = import.meta.glob<string>('../patterns/*/*.{html,tsx,ts}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** What each file of a pattern folder is, and how the code block names it. */
const FILES = {
  vanilla: { file: 'example.html', lang: 'html' },
  react: { file: 'react.tsx', lang: 'tsx' },
  angular: { file: 'angular.ts', lang: 'ts' },
} as const;

export type PatternFramework = keyof typeof FILES;

function source(id: string, file: string) {
  const code = sources[`../patterns/${id}/${file}`];
  if (code === undefined) throw new Error(`No pattern file src/patterns/${id}/${file}`);
  return code;
}

/** Every pattern, by the name of its folder. */
export function patternIds() {
  return [
    ...new Set(
      Object.keys(sources)
        .map((path) => path.split('/')[2])
        .filter(Boolean),
    ),
  ].sort();
}

/** The code of a pattern in each framework, with the language of its code block. */
export function patternCode(id: string) {
  return Object.fromEntries(
    Object.entries(FILES).map(([framework, { file, lang }]) => [
      framework,
      { code: source(id, file).trimEnd(), lang },
    ]),
  ) as Record<PatternFramework, { code: string; lang: string }>;
}

/** The markup of the live preview: the plain HTML version. */
export function patternExample(id: string) {
  return source(id, FILES.vanilla.file);
}

/**
 * The Magma components the plain HTML version uses, by tag, in alphabetical
 * order: the ones in its markup and the ones its script creates.
 */
export function patternComponents(id: string) {
  const uses = patternExample(id).matchAll(
    /<(mds-[a-z-]+)|createElement\(['"](mds-[a-z-]+)['"]\)/g,
  );
  return [...new Set([...uses].map(([, tag, created]) => tag ?? created))].sort();
}
