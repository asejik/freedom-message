import { describe, expect, it } from "vitest";
import { formatSermonDate } from "@/lib/dates";

// The bug this guards against only shows up west of UTC, so the test suite
// also runs this file under a US time zone (see "test" script in package.json).
describe("formatSermonDate", () => {
  it("shows the calendar date as preached, whatever the viewer's time zone", () => {
    expect(formatSermonDate("2026-09-27")).toBe("Sep 27, 2026");
    expect(formatSermonDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("has a compact day-month style", () => {
    expect(formatSermonDate("2026-09-27", "short")).toMatch(/^27 Sept?$/);
  });

  it("handles empty and invalid input without throwing", () => {
    expect(formatSermonDate(null)).toBe("");
    expect(formatSermonDate("")).toBe("");
    expect(formatSermonDate("not a date")).toBe("not a date");
  });
});
