// Client-side setup of Magma, injected into every page by src/integrations/magma.mjs.
import { defineCustomElements } from '@maggioli-design-system/magma/loader';
import { IconsSetService } from '@maggioli-design-system/magma/services';

// Where mds-icon fetches `<slug>.svg` from: iconsauce copies every slug the
// site uses (`mi/...`, `mdi/...`, `mgg/...`) under `svg/`, see iconsauce.config.mjs.
// Set before the components are defined, so no icon fetches from a wrong path.
IconsSetService.setSvgPath(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}svg/`);

// Lazy loader: registers every mds-* tag, each component's code is fetched the
// first time its tag appears. The site documents the whole library, so the
// tree-shakable per-component entry point would not save anything here.
defineCustomElements();

// mds-pref-mode is the light/dark picker of the site (src/components/frame/):
// it sets `pref-mode-light|dark|system` on <html>, Magma's tokens follow it.
// Starlight's styles read `data-theme` instead, set before the first paint by
// src/components/frame/ThemeProvider.astro: keep it on the same scheme.
const root = document.documentElement;
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const syncScheme = () => {
  const mode =
    (['light', 'dark'] as const).find((m) => root.classList.contains(`pref-mode-${m}`)) ?? 'system';
  const scheme = mode === 'system' ? (systemDark.matches ? 'dark' : 'light') : mode;
  if (root.dataset.theme !== scheme) root.dataset.theme = scheme;
};
syncScheme();
new MutationObserver(syncScheme).observe(root, { attributes: true, attributeFilter: ['class'] });
systemDark.addEventListener('change', syncScheme);

// mds-emoji draws nothing in Firefox: its shadow root gives the svg
// `transform-style: preserve-3d`, with nothing in 3D inside it to preserve
// (https://github.com/magma-design-system/magma/issues/1065). Every emoji of
// the page, the home page mascot and the component preview, gets a sheet that
// makes it flat again; Chromium draws it the same either way. On every page
// the router shows, and once on the pages without the router (the previews).
type MagmaElement = HTMLElement & { componentOnReady?(): Promise<unknown> };
const flatEmoji = new CSSStyleSheet();
flatEmoji.replaceSync('svg { transform-style: flat; }');
const flatten = async (emoji: MagmaElement) => {
  await emoji.componentOnReady?.();
  const shadow = emoji.shadowRoot;
  if (shadow && !shadow.adoptedStyleSheets.includes(flatEmoji)) {
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, flatEmoji];
  }
};
const flattenEmojis = async () => {
  await customElements.whenDefined('mds-emoji');
  document.querySelectorAll<MagmaElement>('mds-emoji').forEach(flatten);
};
flattenEmojis();
document.addEventListener('astro:page-load', flattenEmojis);
