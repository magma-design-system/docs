// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import magma from './src/integrations/magma.mjs';
import { locales } from './src/lib/i18n.mjs';
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
