// Client-side setup of Magma, injected into every page by src/integrations/magma.mjs.
import { defineCustomElements } from '@maggioli-design-system/magma/loader';
import { IconsSetService } from '@maggioli-design-system/magma/services';
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';

// Where mds-icon fetches `<slug>.svg` from: iconsauce copies every slug the
// site uses (`mi/...`, `mdi/...`, `mgg/...`) under `svg/`, see iconsauce.config.mjs.
// Set before the components are defined, so no icon fetches from a wrong path.
IconsSetService.setSvgPath(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}svg/`);

// Lazy loader: registers every mds-* tag, each component's code is fetched the
// first time its tag appears. The site documents the whole library, so the
// tree-shakable per-component entry point would not save anything here.
defineCustomElements();

// Where a page opens: the browser scrolls to the `#fragment` of the address as
// the page loads, the router to the fragment or, on a reload and back and
// forward, to the position it saved in the history. Both before the components
// have drawn: once its tag is defined, a component shows nothing of its content
// until its code has arrived and rendered, so the page is still much shorter
// than it will be. The scroll stops short, or at the bottom of the short page,
// and nothing scrolls again as the page grows. Until the reader scrolls,
// clicks or types (10 s at most), each change of size of the page scrolls
// there again.
const READER = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
let release = () => {};
const hold = (scroll: () => void) => {
  release();
  const observer = new ResizeObserver(scroll);
  const stop = () => {
    observer.disconnect();
    clearTimeout(timer);
    for (const type of READER) removeEventListener(type, stop, true);
  };
  const timer = setTimeout(stop, 10_000);
  for (const type of READER) addEventListener(type, stop, { capture: true, passive: true });
  observer.observe(document.documentElement);
  release = stop;
};
/** The router's entries of the history: `{ index, scrollX, scrollY }`. */
type Saved = { scrollX: number; scrollY: number } | null;
const holdPosition = (saved: Saved) => {
  if (!saved?.scrollY) return;
  const { scrollX: left, scrollY: top } = saved;
  hold(() => scrollTo({ left, top, behavior: 'instant' }));
};
const holdFragment = () => {
  let id = '';
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {}
  const target = id && document.getElementById(id);
  if (target) hold(() => target.scrollIntoView({ behavior: 'instant' }));
};
const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
if (entry?.type === 'navigate') holdFragment();
else holdPosition(history.state);
// Read before the swap: as the short page scrolls, the router saves the
// position it ends at over the one it is putting back.
let restore: Saved = null;
document.addEventListener('astro:before-preparation', (event) => {
  release();
  const traverse = (event as TransitionBeforePreparationEvent).navigationType === 'traverse';
  restore = traverse ? history.state : null;
});
document.addEventListener('astro:after-swap', () => {
  if (restore) holdPosition(restore);
  else holdFragment();
});

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
