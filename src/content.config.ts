import { glob } from "astro/loaders"
import { z } from "astro/zod"
import { defineCollection } from "astro:content"

// noinspection JSUnusedGlobalSymbols
export const collections = {
  writing: defineCollection({
    loader: glob({
      base: "src/content/writing",
      pattern: "**/*.md",
      generateId: ({ entry }) =>
        entry.replace(/\/index\.md$/, "").replace(/\.md$/, ""),
    }),
    schema: z.object({
      title: z.string().min(1),
      /** SEO */
      description: z.string().min(1),
      /** Article list */
      teaser: z.string().min(1),
      /** Controls draft status: visible or not in the writing list */
      published_at: z.date().optional(),

      updated_at: z.date().optional(),
    }),
  }),
} as const
