import { format, formatDuration, intervalToDuration } from "date-fns"

export const fmtDate = (start: string): string =>
  format(new Date(start), "MMMM y")

export const fmtDur = (start: string, end: string | undefined): string =>
  formatDuration(
    intervalToDuration({
      start: new Date(start),
      end: new Date(end ?? Date.now()),
    }),
    { format: ["years", "months"] },
  )

export const fmtExpTime = ({
  start,
  end,
  duration = true,
}: {
  start: string
  end?: string
  duration?: boolean
}): string => {
  const dur = duration ? ` (${fmtDur(start, end)})` : ""
  return `${fmtDate(start)} - ${end ? fmtDate(end) : "Present"}${dur}`
}
