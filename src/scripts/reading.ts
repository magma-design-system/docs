/**
 * Where the reader is on the page, for the table of contents and the reading
 * bar (TableOfContents.astro, TwoColumnContent.astro), so they name the same
 * section.
 *
 * `tops`: the scroll position at which each heading is read, where it lands
 * when a link to it is followed (below the scroll padding of the page and its
 * own scroll margin), non-decreasing and at most the end of the page.
 * `index`: the heading being read, the last one reached.
 */
export function readingPosition(headings: HTMLElement[]) {
  const root = document.documentElement;
  const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
  const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  const y = window.scrollY;

  let previous = 0;
  const tops = headings.map((heading) => {
    const line = padding + (parseFloat(getComputedStyle(heading).scrollMarginTop) || 0) + 1;
    const top = heading.getBoundingClientRect().top + y - line;
    previous = Math.min(maxScroll, Math.max(previous, top));
    return previous;
  });

  let index = 0;
  tops.forEach((top, i) => {
    if (y >= top) index = i;
  });
  return { index, tops, maxScroll, y };
}
