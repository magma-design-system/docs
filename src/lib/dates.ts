// Dates in the page language. Shared by the build and the browser: the page
// footer renders "4 weeks ago" when the site is built and updates it on load,
// so it does not age with the build.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Largest unit first. */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * DAY],
  ['month', 30 * DAY],
  ['week', 7 * DAY],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
];

/** `date` from `now`, in the largest unit it spans: "4 weeks ago", "2 anni fa". */
export function relativeDate(date: Date, lang: string, now = new Date()): string {
  const elapsed = now.getTime() - date.getTime();
  const [unit, size] = UNITS.find(([, size]) => elapsed >= size) ?? UNITS.at(-1)!;
  // Never "0 minutes ago", nor in the future when clocks disagree.
  const count = Math.max(1, Math.round(elapsed / size));
  return new Intl.RelativeTimeFormat(lang, { numeric: 'always' }).format(-count, unit);
}
