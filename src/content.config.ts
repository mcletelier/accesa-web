import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** El editor visual guarda los campos opcionales vacíos como "" — se tratan como ausentes */
const empty = (v: unknown) => (v === '' || v === null ? undefined : v);

/**
 * Artículos del blog. Cada archivo .md en src/content/blog es un artículo.
 * El nombre del archivo define la URL: mi-articulo.md → /blog/mi-articulo/
 * Estos campos coinciden con los del editor visual (.pages.yml).
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updated: z.preprocess(empty, z.coerce.date().optional()),
      author: z.preprocess(empty, z.string().default('Mariela Letelier')),
      tags: z.array(z.string()).nullable().default([]).transform((t) => t ?? []),
      image: z.preprocess(empty, z.string().optional()),
      imageAlt: z.preprocess(empty, z.string().optional()),
      draft: z.boolean().default(false),
    })
    // Accesibilidad: si hay imagen destacada, debe tener texto alternativo
    .refine((d) => !d.image || (d.imageAlt && d.imageAlt.trim().length > 0), {
      message: 'La imagen destacada necesita un texto alternativo (imageAlt).',
      path: ['imageAlt'],
    }),
});

export const collections = { blog };
