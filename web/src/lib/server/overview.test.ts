import { describe, it, expect } from "vitest";
import {
  calculateChannelMetrics,
  calculateHealthStats,
  extractTopSermons,
  type SermonLeaderboardRow,
  type HealthCheckRow,
} from "./overview";

describe("calculateChannelMetrics", () => {
  it("calculates weekly and lifetime counts correctly", () => {
    const lifetime = { plays: 150, downloads: 80, views: 300 };
    const weeklyCounts = [
      { event_type: "play", count: 12 },
      { event_type: "download", count: 5 },
      { event_type: "view", count: 40 },
    ];

    const result = calculateChannelMetrics(lifetime, weeklyCounts);

    expect(result.plays.weekly).toBe(12);
    expect(result.plays.lifetime).toBe(150);
    expect(result.downloads.weekly).toBe(5);
    expect(result.downloads.lifetime).toBe(80);
    expect(result.views.weekly).toBe(40);
    expect(result.views.lifetime).toBe(300);
    expect(result.totalEngagement.weekly).toBe(57);
    expect(result.totalEngagement.lifetime).toBe(530);
  });

  it("ensures lifetime counts are never lower than weekly counts", () => {
    const lifetime = { plays: 5, downloads: 0, views: 10 };
    const weeklyCounts = [
      { event_type: "play", count: 20 },
      { event_type: "download", count: 15 },
      { event_type: "view", count: 50 },
    ];

    const result = calculateChannelMetrics(lifetime, weeklyCounts);

    expect(result.plays.weekly).toBe(20);
    expect(result.plays.lifetime).toBe(20);
    expect(result.downloads.weekly).toBe(15);
    expect(result.downloads.lifetime).toBe(15);
    expect(result.views.weekly).toBe(50);
    expect(result.views.lifetime).toBe(50);
  });
});

describe("calculateHealthStats", () => {
  it("computes coverage percentages properly", () => {
    const mockSermons: HealthCheckRow[] = [
      {
        ai_summary: "Great message",
        key_verses: ["John 3:16"],
        ai_tags: ["Faith"],
        artwork_url: "https://example.com/art1.jpg",
      },
      {
        ai_summary: "Another sermon",
        key_verses: null,
        ai_tags: ["Grace"],
        artwork_url: "ERROR", // should not count as valid artwork
      },
      {
        ai_summary: "",
        key_verses: [],
        ai_tags: [],
        artwork_url: null,
      },
      {
        ai_summary: "Third message",
        key_verses: ["Psalm 23"],
        ai_tags: null,
        artwork_url: "https://example.com/art2.jpg",
      },
    ];

    const health = calculateHealthStats(mockSermons);

    expect(health.totalSermons).toBe(4);
    expect(health.withAiSummary).toBe(3);
    expect(health.aiSummaryPercent).toBe(75);
    expect(health.withKeyVerses).toBe(2);
    expect(health.keyVersesPercent).toBe(50);
    expect(health.withAiTags).toBe(2);
    expect(health.aiTagsPercent).toBe(50);
    expect(health.withArtwork).toBe(2);
    expect(health.artworkPercent).toBe(50);
  });

  it("handles empty catalog without division by zero", () => {
    const health = calculateHealthStats([]);
    expect(health.totalSermons).toBe(0);
    expect(health.aiSummaryPercent).toBe(0);
  });
});

describe("extractTopSermons", () => {
  it("sorts by requested metric and limits to 3", () => {
    const rows: SermonLeaderboardRow[] = [
      { id: "1", title: "Sermon A", date_preached: "2026-01-01", play_count: 10, download_count: 2 },
      { id: "2", title: "Sermon B", date_preached: "2026-01-02", play_count: 50, download_count: 1 },
      { id: "3", title: "Sermon C", date_preached: "2026-01-03", play_count: 30, download_count: 15 },
      { id: "4", title: "Sermon D", date_preached: "2026-01-04", play_count: 5, download_count: 8 },
    ];

    const topPlays = extractTopSermons(rows, "play_count", 3);
    expect(topPlays.map((s) => s.id)).toEqual(["2", "3", "1"]);
    expect(topPlays[0].count).toBe(50);

    const topDownloads = extractTopSermons(rows, "download_count", 3);
    expect(topDownloads.map((s) => s.id)).toEqual(["3", "4", "1"]);
    expect(topDownloads[0].count).toBe(15);
  });
});
