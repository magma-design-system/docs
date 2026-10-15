// The iconsauce config of the site, the way Magma has it
// (projects/stencil/.storybook/iconsauce.config.mjs in the Magma repo).
// src/integrations/magma.mjs runs it on every dev start and build and dumps
// every icon of the plugins as an SVG file next to the pages, where mds-icon
// fetches it: the pages of the Icons section show whole sets. `content` still
// counts: iconsauce reports the slugs of the sources that no plugin has. Globs
// are relative to the project root.
import mi from '@iconsauce/material-icons';
import mdi from '@iconsauce/mdi-svg';
import mgg from '@iconsauce/mgg-icons';
import lobe from './src/lib/iconsauce-lobe-icons.mjs';
import { resolveMagma } from './src/lib/magma.mjs';

export default {
  content: [
    './src/**/*.{astro,ts,mjs,md,mdx,json}',
    // The patterns in each framework (src/patterns/).
    './src/patterns/**/*.{html,tsx}',
    // The usage examples of every component page.
    resolveMagma('magma/dist/documentation.json'),
  ],
  plugin: [mi, mdi, mgg, lobe],
};
