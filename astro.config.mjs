// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { componentTags } from './src/lib/magma.mjs';

export default defineConfig({
  site: 'https://magma-design-system.github.io',
  base: '/docs',
  integrations: [
    starlight({
      title: 'Magma',
      description: 'Maggioli Group Design System',
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
          label: 'Start here',
          items: [{ slug: 'about' }],
        },
        {
          label: 'Components',
          collapsed: true,
          items: componentTags().map((tag) => ({
            label: tag,
            link: `/components/${tag}/`,
          })),
        },
      ],
    }),
  ],
});
