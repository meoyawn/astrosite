import { format, formatDuration, intervalToDuration } from "date-fns"

export const fmtDate = (start: string): string =>
  format(new Date(start), "MMMM Y")

export const fmtDur = (start: string, end: string | undefined): string =>
  formatDuration(
    intervalToDuration({
      start: new Date(start),
      end: new Date(end ?? Date.now()),
    }),
    { format: ["years", "months"] },
  )
