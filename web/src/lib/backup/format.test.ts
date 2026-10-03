import { describe, expect, it } from "vitest";
import { daysUntilNextBackup } from "@/lib/backup/format";

const now = new Date("2026-10-03T12:00:00Z");

describe("daysUntilNextBackup", () => {
  it("is null when no backup has ever been recorded", () => {
    expect(daysUntilNextBackup(null, now)).toBeNull();
  });

  it("counts down from 30 days after the last backup", () => {
    expect(daysUntilNextBackup("2026-10-03T12:00:00Z", now)).toBe(30);
    expect(daysUntilNextBackup("2026-09-23T12:00:00Z", now)).toBe(20);
  });

  it("is zero on the due day and negative when overdue", () => {
    expect(daysUntilNextBackup("2026-09-03T12:00:00Z", now)).toBe(0);
    expect(daysUntilNextBackup("2026-08-24T12:00:00Z", now)).toBe(-10);
  });
});
