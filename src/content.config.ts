import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { componentsLoader } from './loaders/components';
import en from './content/i18n/en.json';

const documented = z.looseObject({ name: z.string(), docsHtml: z.string() });

// The keys of the English dictionary are the site's UI strings. Every other
// locale may leave some out: Starlight falls back to English.
const uiStrings = z.object(
  Object.fromEntries(Object.keys(en).map((key) => [key, z.string().optional()])) as Record<
    keyof typeof en,
    z.ZodOptional<z.ZodString>
  >,
);

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema({ extend: uiStrings }) }),
  // The people who write the pages, by the email of their commits: the name
  // and role shown in the page footer (src/components/frame/Footer.astro).
  authors: defineCollection({
    loader: file('src/content/authors.json'),
    schema: z.object({ name: z.string(), role: z.string() }),
  }),
  components: defineCollection({
    loader: componentsLoader(),
    schema: z.object({
      tag: z.string(),
      summary: z.string(),
      readmeHtml: z.string(),
      usage: z.array(z.object({ title: z.string(), html: z.string() })),
      props: z.array(documented),
      events: z.array(z.looseObject({ event: z.string(), docsHtml: z.string() })),
      methods: z.array(documented),
      slots: z.array(documented),
      styles: z.array(documented),
      parts: z.array(documented),
      dependents: z.array(z.string()),
      dependencies: z.array(z.string()),
      encapsulation: z.string(),
    }),
  }),
};
