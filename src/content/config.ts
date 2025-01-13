import { defineCollection, z } from "astro:content"

// noinspection JSUnusedGlobalSymbols
export const collections = {
  articles: defineCollection({
    type: "content",
    schema: z.object({
      title: z.string(),
      description: z.string(),
      published_at: z.date().optional(),
    }),
  }),
} as const
