import { glob } from "astro/loaders"
import { z } from "astro/zod"
import { defineCollection } from "astro:content"

// noinspection JSUnusedGlobalSymbols
export const collections = {
  articles: defineCollection({
    loader: glob({
      base: "src/content/articles",
      pattern: "**/*.md",
      generateId: ({ entry }) =>
        entry.replace(/\/index\.md$/, "").replace(/\.md$/, ""),
    }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      /** Controls draft status: visible or not in the article list */
      published_at: z.date().optional(),
    }),
  }),
} as const
