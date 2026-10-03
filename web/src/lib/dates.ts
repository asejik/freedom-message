// Sermon dates are calendar dates ("2026-09-27"), not moments in time.
// `new Date("2026-09-27")` means midnight UTC, so formatting it in the viewer's
// own time zone showed the previous day anywhere west of UTC (e.g. the Americas).
// Formatting in UTC keeps the date exactly as preached, for every viewer.

const LONG = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Formats a sermon's date_preached (YYYY-MM-DD) for display.
 * "long": "Sep 27, 2026" (cards, sermon page). "short": "27 Sept" (compact lists).
 * Returns the input unchanged if it isn't a valid date, and "" for empty input.
 */
export function formatSermonDate(value: string | null | undefined, style: "long" | "short" = "long"): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return (style === "short" ? SHORT : LONG).format(date);
}
