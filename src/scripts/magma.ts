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
  const mode = (['light', 'dark'] as const).find((m) => root.classList.contains(`pref-mode-${m}`)) ?? 'system';
  const scheme = mode === 'system' ? (systemDark.matches ? 'dark' : 'light') : mode;
  if (root.dataset.theme !== scheme) root.dataset.theme = scheme;
};
syncScheme();
new MutationObserver(syncScheme).observe(root, { attributes: true, attributeFilter: ['class'] });
systemDark.addEventListener('change', syncScheme);
