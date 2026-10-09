// Wires Magma into the site: the client setup script on every page and the
// svg-icons set served next to the pages. Styles go through Starlight's
// `customCss` instead, which fixes their place in the cascade layer order.
import { cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { svgIconsDir } from '../lib/magma.mjs';

/** URL path, under the site base, where mds-icon finds the `mgg/` set. */
const ICONS_PATH = 'svg/mgg/';

const LOADER = '@maggioli-design-system/magma/loader';

/**
 * magma 2.0.1 declares `"sideEffects": ["**\/*.css"]`, so production builds
 * drop the top of loader/index.js: the shim that lets the ES5 build (the one
 * `./loader` points to) extend HTMLElement. Without it every component throws
 * "Failed to construct 'HTMLElement'" on upgrade. Dev is not affected, the
 * dependency optimizer ignores `sideEffects`. Keep that one module whole.
 * Tracked in https://github.com/magma-design-system/magma/issues/817
 * @returns {import('vite').Plugin}
 */
function keepLoaderSideEffects() {
  return {
    name: 'magma:loader-side-effects',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source !== LOADER) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved && { ...resolved, moduleSideEffects: true };
    },
  };
}

/** @returns {import('astro').AstroIntegration} */
export default function magma() {
  let base = '/';

  return {
    name: 'magma',
    hooks: {
      'astro:config:setup': ({ config, injectScript, updateConfig }) => {
        base = config.base.replace(/\/?$/, '/');
        updateConfig({ vite: { plugins: [keepLoaderSideEffects()] } });
        injectScript('page', `import '/src/scripts/magma.ts';`);
      },

      // Dev: serve the icons straight from node_modules. Astro's dev server
      // strips the base from `req.url`; `originalUrl` keeps the requested path.
      'astro:server:setup': ({ server }) => {
        const prefix = `${base}${ICONS_PATH}`;
        server.middlewares.use(async (req, res, next) => {
          const url = req.originalUrl ?? req.url ?? '';
          const name = url.startsWith(prefix) ? url.slice(prefix.length).split('?')[0] : '';
          if (!/^[a-z0-9-]+\.svg$/.test(name)) return next();
          try {
            const svg = await readFile(join(svgIconsDir(), name));
            res.setHeader('Content-Type', 'image/svg+xml');
            res.end(svg);
          } catch {
            next();
          }
        });
      },

      // Build: copy the icons into the output.
      'astro:build:done': async ({ dir, logger }) => {
        await cp(svgIconsDir(), new URL(ICONS_PATH, dir), { recursive: true });
        logger.info(`Copied svg-icons to ${ICONS_PATH}`);
      },
    },
  };
}
