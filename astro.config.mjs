// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import magma from './src/integrations/magma.mjs';
import { componentTags } from './src/lib/magma.mjs';
import { locales, sidebarLabel } from './src/lib/i18n.mjs';

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
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/magma-design-system/magma',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/magma-design-system/docs/edit/main/',
      },
      sidebar: [
        {
          ...sidebarLabel('nav.startHere'),
          items: [{ slug: 'about' }],
        },
        {
          ...sidebarLabel('nav.components'),
          collapsed: true,
          items: componentTags().map((tag) => ({
            label: tag,
            link: `/components/${tag}/`,
          })),
        },
      ],
    }),
    magma(),
  ],
});
