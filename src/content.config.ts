import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { componentsLoader } from './loaders/components';
import { patternsLoader } from './loaders/patterns';
import en from './content/i18n/en.json';

const documented = z.looseObject({ name: z.string(), docsHtml: z.string() });
// A usage file rendered as a page: its headings make the table of contents.
const guide = z.object({
  html: z.string(),
  headings: z.array(z.object({ depth: z.number(), slug: z.string(), text: z.string() })),
});

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
  // The people who write the pages, by GitHub login: the name and role shown
  // in the page footer (src/components/frame/Footer.astro), and the emails of
  // their commits besides GitHub's noreply one (src/lib/authors.mjs).
  authors: defineCollection({
    loader: file('src/content/authors.json'),
    schema: z.object({
      name: z.string(),
      role: z.string(),
      emails: z.array(z.email()).optional(),
    }),
  }),
  components: defineCollection({
    loader: componentsLoader(),
    schema: z.object({
      tag: z.string(),
      summary: z.string(),
      descriptionHtml: z.string(),
      examples: guide,
      mistakes: guide,
      example: z.string(),
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
  // What magma ships in agents/patterns/, one page each: the domains of the
  // design language, the patterns, the building blocks.
  patterns: defineCollection({
    loader: patternsLoader(),
    schema: z.object({
      kind: z.enum(['design-language', 'pattern', 'block']),
      group: z.string().optional(),
      status: z.enum(['decided', 'candidate']),
      title: z.string(),
      need: z.string(),
      principle: z.string(),
      // The body, and the previews the stage at the top of the page runs: the
      // cases, then the rules that are always true, then the situations of a
      // block.
      ...guide.shape,
      previews: z.array(
        z.object({
          id: z.string(),
          of: z.enum(['case', 'rule', 'situation']),
          try: z.string(),
          height: z.number().optional(),
          wholePage: z.boolean(),
          markup: z.string(),
        }),
      ),
    }),
  }),
};
