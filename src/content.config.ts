import * as v from "valibot"
import type { CollectionDefinition } from "vite-static-site/content"

export const writingSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.pipe(v.string(), v.minLength(1)),
  teaser: v.pipe(v.string(), v.minLength(1)),
  published_at: v.exactOptional(v.date()),
  updated_at: v.exactOptional(v.date()),
})

export type WritingData = v.InferOutput<typeof writingSchema>

export const parseWritingData = (
  value: unknown,
  sourceName: string,
): WritingData => {
  const result = v.safeParse(writingSchema, value)

  if (!result.success) {
    throw new TypeError(
      `${sourceName} does not match the writing collection schema: ${v.summarize(
        result.issues,
      )}`,
    )
  }

  return result.output
}

const writing = {
  directory: "src/content/writing",
  pattern: /\.md$/,
  schema: parseWritingData,
} satisfies CollectionDefinition<WritingData>

export const collections = { writing }
