import {defineCollection} from 'astro:content';
import {glob} from 'astro/loaders';
import {docsLoader} from '@astrojs/starlight/loaders';
import {docsSchema} from '@astrojs/starlight/schema';
import {z} from 'astro:content';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        sourcePath: z.string().optional(),
        sourceUrl: z.string().optional(),
      }),
    }),
  }),
  blog: defineCollection({
    loader: glob({pattern: '*.md', base: './src/content/blog'}),
    schema: z.object({
      title: z.string(),
      slug: z.string(),
      date: z.string(),
      description: z.string().optional(),
    }),
  }),
};
