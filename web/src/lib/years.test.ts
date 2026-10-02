import { afterEach, describe, expect, it, vi } from "vitest";
import { getYearOptions } from "@/lib/years";

afterEach(() => vi.useRealTimers());

describe("getYearOptions", () => {
  it("lists every year from the current one back to 2015, newest first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    const years = getYearOptions();
    expect(years[0]).toEqual({ id: "2026", label: "2026" });
    expect(years[years.length - 1]).toEqual({ id: "2015", label: "2015" });
    expect(years).toHaveLength(12);
  });

  it("picks up a new year automatically (the list used to be hardcoded to 2026)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-03-01T12:00:00Z"));
    expect(getYearOptions()[0].id).toBe("2027");
    expect(getYearOptions()).toHaveLength(13);
  });
});
