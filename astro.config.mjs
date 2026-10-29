// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import magma from './src/integrations/magma.mjs';
import { localeParams, locales } from './src/lib/i18n.mjs';
import { componentTags } from './src/lib/magma.mjs';
import { sidebar } from './src/lib/nav.mjs';

/**
 * Starlight components replaced by the frame built with Magma components (the
 * page title, the hero and the draft and untranslated notices included), and
 * the <head> that adds Astro's ClientRouter to it.
 */
const frame = Object.fromEntries(
  [
    'DraftContentNotice',
    'FallbackContentNotice',
    'Footer',
    'Head',
    'Header',
    'Hero',
    'PageFrame',
    'PageSidebar',
    'PageTitle',
    'Sidebar',
    'TableOfContents',
    'ThemeProvider',
    'TwoColumnContent',
  ].map((name) => [name, `./src/components/frame/${name}.astro`]),
);

const base = '/docs';

/**
 * The sub-pages of every component that moved: Pattern and Antipattern became
 * Examples and Mistakes (https://github.com/magma-design-system/magma/issues/1169).
 */
const movedComponentPages = Object.fromEntries(
  localeParams.flatMap((locale) =>
    componentTags().flatMap((tag) =>
      Object.entries({ pattern: 'examples', antipattern: 'mistakes' }).map(([from, to]) => {
        const page = `${locale ? `/${locale}` : ''}/components/${tag}`;
        return [`${page}/${from}/`, `${base}${page}/${to}/`];
      }),
    ),
  ),
);

/** The favicons of src/pages/favicons/[file].ts, other than the SVG one (`favicon`). */
const favicons = [
  // Before the SVG, as Starlight sorts them: the browsers that have both take the SVG.
  { rel: 'icon', href: 'favicon.ico', sizes: '16x16 32x32 48x48' },
  { rel: 'apple-touch-icon', href: 'apple-touch-icon.png' },
  { rel: 'manifest', href: 'manifest.webmanifest' },
].map((attrs) => ({
  tag: /** @type {const} */ ('link'),
  attrs: { ...attrs, href: `${base}/favicons/${attrs.href}` },
}));

export default defineConfig({
  site: 'https://magma-design-system.github.io',
  base,
  // Pages that moved, so that links from elsewhere keep working. The source is
  // under `base`; the destination is not: Astro writes it as it is.
  redirects: {
    '/development/agentic-development/': `${base}/ai/start-a-project/`,
    '/it/development/agentic-development/': `${base}/it/ai/start-a-project/`,
    ...movedComponentPages,
  },
  integrations: [
    starlight({
      title: 'Magma',
      description: 'Maggioli Group Design System',
      favicon: '/favicons/favicon.svg',
      head: favicons,
      defaultLocale: 'root',
      locales,
      // First entry: it declares the cascade layer order for the whole site.
      customCss: ['./src/styles/magma.css'],
      components: frame,
      editLink: {
        baseUrl: 'https://github.com/magma-design-system/docs/edit/main/',
      },
      // The topics of the galleries of Patterns and Building blocks in the
      // table of contents of their landing pages.
      routeMiddleware: './src/route-data.ts',
      // The page footer (Footer.astro) has no previous/next links.
      pagination: false,
      // One group per section of the rail: src/lib/nav.mjs.
      sidebar: sidebar(),
    }),
    magma(),
  ],
  vite: {
    // Tailwind v4: the utilities used in the sources, Magma's theme (src/styles/magma.css).
    plugins: [tailwindcss()],
  },
});
