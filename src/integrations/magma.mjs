// Wires Magma into the site: the client setup script on every page, the icons
// the site uses, collected by iconsauce and served next to the pages, and the
// Markdown tables rendered as mds-table (src/lib/markdown-tables.mjs).
// Styles go through Starlight's `customCss` instead, which fixes their place in
// the cascade layer order.
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build, IconsauceConfig } from '@iconsauce/core';
import { magmaTables } from '../lib/markdown-tables.mjs';

/** Folder of `publicDir` where mds-icon fetches `<slug>.svg` (see src/scripts/magma.ts). */
const ICONS_DIR = 'svg/';

const ICONSAUCE_CONFIG = 'iconsauce.config.mjs';

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

/**
 * Copies every icon slug found by iconsauce to `<outDir>/<slug>.svg`, what the
 * iconsauce CLI does with `--output-svg`. Generated, so the folder is
 * gitignored and rebuilt from scratch.
 * @param {URL} root
 * @param {URL} outDir
 * @returns {Promise<number>} number of icons
 */
async function collectIcons(root, outDir) {
  const config = await new IconsauceConfig().loadConfig(
    fileURLToPath(new URL(ICONSAUCE_CONFIG, root)),
  );
  const icons = (await build(config))?.list ?? new Map();
  await rm(outDir, { recursive: true, force: true });
  for (const [slug, file] of icons) {
    await cp(file.toString(), fileURLToPath(new URL(`${slug}.svg`, outDir)));
  }
  return icons.size;
}

/** @returns {import('astro').AstroIntegration} */
export default function magma() {
  /** @type {URL} */
  let root;
  /** @type {URL} */
  let outDir;

  return {
    name: 'magma',
    hooks: {
      'astro:config:setup': async ({ config, injectScript, updateConfig, logger }) => {
        root = config.root;
        outDir = new URL(ICONS_DIR, config.publicDir);
        updateConfig({ vite: { plugins: [keepLoaderSideEffects()] } });
        injectScript('page', `import '/src/scripts/magma.ts';`);
        // Markdown tables as mds-table, on Astro's Markdown processor (Satteri):
        // `markdown.rehypePlugins` would need the unified processor instead.
        const markdown = config.markdown.processor;
        if (!markdown?.options?.hastPlugins) {
          throw new Error('magma: expected the Satteri Markdown processor (Astro 7 default)');
        }
        markdown.options.hastPlugins.push(magmaTables());
        logger.info(`iconsauce: ${await collectIcons(root, outDir)} icons in public/${ICONS_DIR}`);
      },

      // Dev: collect again when a source file adds or drops a slug.
      'astro:server:setup': ({ server, logger }) => {
        const src = fileURLToPath(new URL('src/', root));
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let timer;
        server.watcher.on('all', (_event, file) => {
          if (!file.startsWith(src)) return;
          clearTimeout(timer);
          timer = setTimeout(async () => {
            logger.info(`iconsauce: ${await collectIcons(root, outDir)} icons`);
          }, 300);
        });
      },
    },
  };
}
