// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import magma from './src/integrations/magma.mjs';
import { locales } from './src/lib/i18n.mjs';
import { sidebar } from './src/lib/nav.mjs';

/** Starlight components replaced by the frame built with Magma components. */
const frame = Object.fromEntries(
  [
    'Header',
    'PageFrame',
    'PageSidebar',
    'Sidebar',
    'TableOfContents',
    'ThemeProvider',
    'TwoColumnContent',
  ].map((name) => [name, `./src/components/frame/${name}.astro`]),
);

export default defineConfig({
  site: 'https://magma-design-system.github.io',
  base: '/docs',
  integrations: [
    starlight({
      title: 'Magma',
      description: 'Maggioli Group Design System',
      defaultLocale: 'root',
      locales,
      // First entry: it declares the cascade layer order for the whole site.
      customCss: ['./src/styles/magma.css'],
      components: frame,
      editLink: {
        baseUrl: 'https://github.com/magma-design-system/docs/edit/main/',
      },
      // One group per section of the rail: src/lib/nav.mjs.
      sidebar: sidebar(),
    }),
    magma(),
  ],
});
