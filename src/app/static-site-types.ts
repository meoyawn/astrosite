import type { collections } from "../content.config.ts"
import { parseWritingData } from "../content.config.ts"
import type {
  LoadedCollectionEntry,
  RenderedCollectionEntryFor,
} from "../../tooling/vite-static-site/content.ts"

export type WritingEntry = RenderedCollectionEntryFor<
  typeof collections,
  "writing"
>

export const parseWritingEntry = (
  entry: LoadedCollectionEntry,
): WritingEntry => {
  if (entry.body === undefined || entry.rendered === undefined) {
    throw new TypeError(`Writing entry ${entry.id} has no rendered Markdown`)
  }

  return {
    body: entry.body,
    data: parseWritingData(entry.data, entry.id),
    id: entry.id,
    rendered: entry.rendered,
  }
}
