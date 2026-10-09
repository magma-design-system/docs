// Client-side setup of Magma, injected into every page by src/integrations/magma.mjs.
import { defineCustomElements } from '@maggioli-design-system/magma/loader';
import { IconsSetService } from '@maggioli-design-system/magma/services';

// Where mds-icon fetches `<name>.svg` from: the svg-icons set is served under
// `svg/mgg/`, so `<mds-icon name="mgg/...">` resolves as in Magma's own docs.
// Set before the components are defined, so no icon fetches from a wrong path.
IconsSetService.setSvgPath(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}svg/`);

// Lazy loader: registers every mds-* tag, each component's code is fetched the
// first time its tag appears. The site documents the whole library, so the
// tree-shakable per-component entry point would not save anything here.
defineCustomElements();

// Starlight's theme picker writes `data-theme="light|dark"` on <html> (with
// "auto" already resolved). Mirror it to the classes mds-pref-mode writes, so
// Magma tokens and components follow the same scheme as the frame.
const root = document.documentElement;
const syncScheme = () => {
  const scheme = root.dataset.theme === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-magma-pref', '');
  root.classList.remove('pref-mode-light', 'pref-mode-dark', 'pref-mode-system');
  root.classList.add(`pref-mode-${scheme}`);
};
syncScheme();
new MutationObserver(syncScheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
