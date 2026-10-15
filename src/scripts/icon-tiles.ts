// What the icon pages share in the browser (IconSet.astro, LegacyIcons.astro):
// the tiles copied on click through CopyToClipboard.astro, what a click
// copies, the format picked last and the check a tile shows once copied.

/** The classes of a tile: a column with the icon and its name, tinted while copied. */
export const TILE =
  'flex flex-col items-center gap-300 rounded-xl px-200 pt-500 pb-400 text-center text-fg-default transition-cosmetic hover:bg-surface-overlay hover:shadow-outline-weak data-copied:bg-success-surface data-copied:text-success-fg';

/** What a click on a tile of a set copies, by format; the first one is the default. */
export const SLUG_FORMATS: Record<string, (slug: string) => string> = {
  slug: (slug) => slug,
  mdsIcon: (slug) => `<mds-icon name="${slug}"></mds-icon>`,
  font: (slug) => `<i class="${slug}" aria-hidden="true"></i>`,
};

/** localStorage key of the format picked last, for the sets or for the icons package. */
export const formatKey = (kind: 'iconsauce' | 'icons') => `magma-docs:icon-format:${kind}`;

export const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

/** A text with its `{name}` placeholders filled in. */
export const fill = (text: string | undefined, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text ?? '',
  );

/** The label of a copy button, as CopyToClipboard.astro writes it. */
export const copyLabel = (value: string) =>
  fill(document.querySelector<HTMLElement>('[data-copy-live]')?.dataset.label, { value });

/** The tiles CopyToClipboard.astro has not made into buttons yet become buttons. */
export const enhanceCopies = () => document.dispatchEvent(new Event('copy:enhance'));

const COPIED_ICON = 'mi/baseline/check';
/** How long a tile shows the check, in milliseconds. */
const SHOWN = 1500;

/** A copied tile of `root` shows a check in place of its icon for a moment. */
export function showCopies(root: HTMLElement) {
  const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  root.addEventListener('copied', (event) => {
    const tile =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>('[data-icon-tile]')
        : null;
    if (!tile || !(event as CustomEvent<{ copied: boolean }>).detail.copied) return;
    const icon = tile.querySelector('mds-icon');
    icon?.setAttribute('name', COPIED_ICON);
    tile.setAttribute('data-copied', '');
    clearTimeout(timers.get(tile));
    timers.set(
      tile,
      setTimeout(() => {
        icon?.setAttribute('name', tile.dataset.slug ?? '');
        tile.removeAttribute('data-copied');
      }, SHOWN),
    );
  });
}

/**
 * The sticky bars of the page (search, styles, category) that stick right
 * now get `data-stuck`, and with it the shadow that parts them from the
 * tiles scrolling under them. One listener for every bar of every page the
 * router shows: the bars that left the page are dropped.
 */
const bars = new Set<HTMLElement>();
let frame = 0;
const checkBars = () => {
  frame = 0;
  for (const bar of bars) {
    if (!bar.isConnected) {
      bars.delete(bar);
      continue;
    }
    const top = parseFloat(getComputedStyle(bar).top) || 0;
    bar.toggleAttribute('data-stuck', scrollY > 0 && bar.getBoundingClientRect().top <= top + 0.5);
  }
};
const scheduleBars = () => {
  frame ||= requestAnimationFrame(checkBars);
};

export function markStuck(bar: HTMLElement) {
  if (bars.size === 0) {
    addEventListener('scroll', scheduleBars, { passive: true });
    addEventListener('resize', scheduleBars);
  }
  bars.add(bar);
  scheduleBars();
}
