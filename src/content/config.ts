import { defineCollection, z } from "astro:content"

export const collections = {
  articles: defineCollection({
    type: "content",
    schema: z.object({
      title: z.string(),
      description: z.string(),
      draft: z.boolean().optional(),
    }),
  }),
} as const
