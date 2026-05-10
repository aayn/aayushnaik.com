// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const essays = defineCollection({
  loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    importance: z.number().int().min(0).max(10),
    confidence: z.enum([
      'certain',
      'highly likely',
      'likely',
      'possible',
      'unlikely',
      'highly unlikely',
      'remote',
      'impossible',
      'log',
      'emotional',
    ]),
    status: z.enum(['notes', 'draft', 'in progress', 'finished']),
    stance: z.enum(['agree', 'disagree', 'withholding']).optional(),
  }),
});

export const collections = { essays };
