// Wires Magma into the site: the client setup script on every page, every icon
// of the iconsauce sets, dumped by iconsauce and served next to the pages, and
// Markdown rendered with Magma components: tables as mds-table
// (src/lib/markdown-tables.mjs), text as mds-text, mds-list and mds-hr
// (src/lib/markdown-text.mjs).
// Styles go through Starlight's `customCss` instead, which fixes their place in
// the cascade layer order.
import { createHash } from 'node:crypto';
import { cp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build, IconsauceConfig } from '@iconsauce/core';
import { magmaTables } from '../lib/markdown-tables.mjs';
import { magmaText } from '../lib/markdown-text.mjs';

/** Folder of `publicDir` where mds-icon fetches `<slug>.svg` (see src/scripts/magma.ts). */
const ICONS_DIR = 'svg/';

const ICONSAUCE_CONFIG = 'iconsauce.config.mjs';

const LOADER = '@maggioli-design-system/magma/loader';

/**
 * magma 2.1.0 still declares `"sideEffects": ["**\/*.css"]`, so production builds
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

/** Where the dump records what it copied, to skip the next copy of the same icons. */
const STAMP = '.iconsauce-dump.json';

/**
 * Copies every icon of the iconsauce plugins to `<outDir>/<slug>.svg`, what
 * the iconsauce CLI does with `--output-dump-svg`: the icon pages of the site
 * show whole sets, and any slug works. The dump depends on the icon sets
 * installed, not on the sources, so a folder that already holds the same files
 * is left as it is. Generated, so the folder is gitignored.
 * @param {URL} root
 * @param {URL} outDir
 * @returns {Promise<{ icons: number, copied: boolean }>}
 */
async function dumpIcons(root, outDir) {
  const config = await new IconsauceConfig().loadConfig(
    fileURLToPath(new URL(ICONSAUCE_CONFIG, root)),
  );
  // Also reports the slugs of the sources that no plugin has.
  const icons = (await build(config))?.dictionary ?? new Map();
  const files = await Promise.all(
    [...icons].map(async ([slug, file]) => ({
      slug,
      file: file.toString(),
      size: (await stat(file)).size,
    })),
  );
  // Sorted: iconsauce lists the icons in no fixed order.
  files.sort((a, b) => a.slug.localeCompare(b.slug));
  const hash = createHash('sha256');
  for (const { slug, size } of files) hash.update(`${slug}:${size}\n`);
  const stamp = hash.digest('hex');
  const stampFile = new URL(STAMP, outDir);
  if ((await readFile(stampFile, 'utf8').catch(() => '')) === stamp) {
    return { icons: icons.size, copied: false };
  }
  await rm(outDir, { recursive: true, force: true });
  // A few at a time: thousands of copies at once would run out of file handles.
  for (let i = 0; i < files.length; i += 64) {
    await Promise.all(
      files
        .slice(i, i + 64)
        .map(({ slug, file }) => cp(file, fileURLToPath(new URL(`${slug}.svg`, outDir)))),
    );
  }
  await writeFile(stampFile, stamp);
  return { icons: icons.size, copied: true };
}

/** @returns {import('astro').AstroIntegration} */
export default function magma() {
  return {
    name: 'magma',
    hooks: {
      'astro:config:setup': async ({ config, injectScript, updateConfig, logger }) => {
        const outDir = new URL(ICONS_DIR, config.publicDir);
        updateConfig({ vite: { plugins: [keepLoaderSideEffects()] } });
        injectScript('page', `import '/src/scripts/magma.ts';`);
        // Markdown as Magma components, on Astro's Markdown processor (Satteri):
        // `markdown.rehypePlugins` would need the unified processor instead.
        // Text after the tables, so the code in their cells is converted too.
        const markdown = config.markdown.processor;
        if (!markdown?.options?.hastPlugins) {
          throw new Error('magma: expected the Satteri Markdown processor (Astro 7 default)');
        }
        markdown.options.hastPlugins.push(magmaTables(), magmaText());
        const dump = await dumpIcons(config.root, outDir);
        logger.info(
          `iconsauce: ${dump.icons} icons in public/${ICONS_DIR}${dump.copied ? '' : ', already there'}`,
        );
      },
    },
  };
}
