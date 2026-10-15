// Icons the site uses, collected by iconsauce the way Magma does it
// (projects/stencil/.storybook/iconsauce.config.mjs in the Magma repo): every
// `mi/<variant>/<name>`, `mdi/<name>` and `mgg/<name>` slug found in `content`
// is copied as an SVG file next to the pages, where mds-icon fetches it.
// Run by src/integrations/magma.mjs on every dev start and build. Globs are
// relative to the project root.
import mi from '@iconsauce/material-icons';
import mdi from '@iconsauce/mdi-svg';
import mgg from '@iconsauce/mgg-icons';
import { resolveMagma } from './src/lib/magma.mjs';

export default {
  content: [
    './src/**/*.{astro,ts,mjs,md,mdx,json}',
    // The usage examples of every component page.
    resolveMagma('magma/dist/documentation.json'),
    // The whole mgg set, for the icon library: the list svg-icons publishes for iconsauce.
    resolveMagma('svg-icons/dist/iconsauce.json'),
  ],
  plugin: [mi, mdi, mgg],
};
