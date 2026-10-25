// The page of each component in Magma's Storybook, for the button next to
// Reset under its preview (Playground.astro): its stories, with more cases than
// the preview has. The packages do not say which stories are a component's
// (not filed yet, see agents/magma.md), and the ids of the stories do not
// follow the tag (`mds-icon` is `design-icon`, `mds-input-otp` is `form-otp`).
// Until they do, the site reads the index of the published Storybook once per
// build: each entry names the file it comes from
// (`./src/components/<tag>/...`). A component's own page is the one with the
// shortest title (`UI / Content / Image`, not its `ARIA` section): its docs
// page, which shows every story, or else its first story. Without the index
// (offline, Storybook down) the pages have no button, and the build goes on.
import { STORYBOOK } from './nav.mjs';

interface Entry {
  id: string;
  title: string;
  type: 'docs' | 'story';
  importPath?: string;
}

const COMPONENT_FILE = /\/components\/(mds-[a-z0-9-]+)\//;
/** How long the build waits for the index. */
const TIMEOUT = 10_000;

let pages: Promise<Map<string, string>> | undefined;

/** Fewer levels first, then the shorter title. */
const closer = (a: Entry, b: Entry) =>
  a.title.split('/').length - b.title.split('/').length || a.title.length - b.title.length;

async function load(): Promise<Map<string, string>> {
  const response = await fetch(new URL('index.json', STORYBOOK), {
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { entries } = (await response.json()) as { entries: Record<string, Entry> };
  const byTag = new Map<string, Entry[]>();
  for (const entry of Object.values(entries)) {
    const tag = COMPONENT_FILE.exec(entry.importPath ?? '')?.[1];
    if (tag) byTag.set(tag, [...(byTag.get(tag) ?? []), entry]);
  }
  return new Map(
    [...byTag].map(([tag, list]) => {
      const title = [...list].sort(closer)[0].title;
      const own = list.filter((entry) => entry.title === title);
      const docs = own.find((entry) => entry.type === 'docs');
      const path = docs ? `/docs/${docs.id}` : `/story/${own[0].id}`;
      return [tag, `${STORYBOOK}?path=${path}`];
    }),
  );
}

/** The address of a component's page in Storybook, if the index has one. */
export async function storybookHref(tag: string): Promise<string | undefined> {
  pages ??= load().catch((error) => {
    console.warn(`Storybook index not read, no Storybook buttons: ${error}`);
    return new Map();
  });
  return (await pages).get(tag);
}
