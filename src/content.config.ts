import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

// noinspection JSUnusedGlobalSymbols
export const collections = {
  articles: defineCollection({
    loader: glob({ base: "./src/content/articles", pattern: "**/*.md" }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      published_at: z.date().optional(),
    }),
  }),
} as const
