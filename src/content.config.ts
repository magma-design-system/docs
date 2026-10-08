import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { componentsLoader } from './loaders/components';

const documented = z.looseObject({ name: z.string(), docsHtml: z.string() });

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
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
