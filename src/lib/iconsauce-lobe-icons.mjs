// An iconsauce plugin for the LobeHub icons (@lobehub/icons-static-svg, MIT):
// the logos of the AI products and their makers, which no set of Magma has.
// Shaped like the @iconsauce/* plugins, kept here until it is worth a package
// of its own. Slugs are `lobe/<file>`: `lobe/claudecode` is the plain mark,
// drawn in `currentColor`, `lobe/claudecode-color` the mark in its brand
// colors (only for the brands that have them). The logos stay trademarks of
// their owners: the site uses them to name the products, nothing more.
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);
const root = dirname(require.resolve('@lobehub/icons-static-svg/package.json'));

/** @type {import('@iconsauce/plugin').IconsaucePlugin} */
export default {
  prefix: 'lobe',
  regex: {
    code: /(lobe)(\/{1}[0-9a-z-]+){1}/gm,
    lib: /([a-zA-Z_\-/]+\/([0-9a-zA-Z_-]+)\.svg)/,
  },
  selector: (path) => `lobe/${path[2]}`,
  path: `${root}/icons/*.svg`,
};
