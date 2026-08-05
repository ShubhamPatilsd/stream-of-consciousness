import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const thoughts = defineCollection({
	loader: glob({ base: './src/content/thoughts', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		publishedAt: z.coerce.date(),
		title: z.string().optional(),
	}),
});

export const collections = { thoughts };
