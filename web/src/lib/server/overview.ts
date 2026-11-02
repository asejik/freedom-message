// =============================================================================
// Messages — Admin Overview & Channel Statistics Logic
// Pure helpers + data aggregation for the admin overview dashboard
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface TopSermonItem {
  id: string;
  title: string;
  date_preached: string;
  preacher_name: string;
  series_name: string | null;
  count: number;
}

export interface MetricWithWeekly {
  weekly: number;
  lifetime: number;
}

export interface ChannelMetrics {
  views: MetricWithWeekly;
  plays: MetricWithWeekly;
  downloads: MetricWithWeekly;
  totalEngagement: MetricWithWeekly;
}

export interface ContentHealthStats {
  totalSermons: number;
  withAiSummary: number;
  aiSummaryPercent: number;
  withKeyVerses: number;
  keyVersesPercent: number;
  withAiTags: number;
  aiTagsPercent: number;
  withArtwork: number;
  artworkPercent: number;
}

export interface PreacherContribution {
  name: string;
  sermonCount: number;
}

export interface OverviewStatsData {
  metrics: ChannelMetrics;
  topPlayed: TopSermonItem[];
  topDownloaded: TopSermonItem[];
  topViewed: TopSermonItem[];
  health: ContentHealthStats;
  totalSeries: number;
  totalPreachers: number;
  topPreachers: PreacherContribution[];
  recentErrorsCount: number;
  generatedAt: string;
}

// ── Pure Calculation Helpers (Unit-Tested) ───────────────────────────────────

export interface RawEventCount {
  event_type: string;
  count: number;
}

/**
 * Computes weekly and lifetime channel engagement numbers.
 * Lifetime counts never fall below weekly counts.
 */
export function calculateChannelMetrics(
  lifetime: { plays: number; downloads: number; views: number },
  weeklyCounts: RawEventCount[]
): ChannelMetrics {
  let weeklyPlays = 0;
  let weeklyDownloads = 0;
  let weeklyViews = 0;

  for (const item of weeklyCounts) {
    if (item.event_type === "play") weeklyPlays += item.count;
    else if (item.event_type === "download") weeklyDownloads += item.count;
    else if (item.event_type === "view") weeklyViews += item.count;
  }

  const playsLifetime = Math.max(lifetime.plays, weeklyPlays);
  const downloadsLifetime = Math.max(lifetime.downloads, weeklyDownloads);
  const viewsLifetime = Math.max(lifetime.views, weeklyViews);

  return {
    views: {
      weekly: weeklyViews,
      lifetime: viewsLifetime,
    },
    plays: {
      weekly: weeklyPlays,
      lifetime: playsLifetime,
    },
    downloads: {
      weekly: weeklyDownloads,
      lifetime: downloadsLifetime,
    },
    totalEngagement: {
      weekly: weeklyViews + weeklyPlays + weeklyDownloads,
      lifetime: viewsLifetime + playsLifetime + downloadsLifetime,
    },
  };
}

export interface HealthCheckRow {
  ai_summary?: string | null;
  key_verses?: string[] | null;
  ai_tags?: string[] | null;
  artwork_url?: string | null;
}

/**
 * Computes coverage percentages for AI summaries, verses, tags, and artwork.
 */
export function calculateHealthStats(sermons: HealthCheckRow[]): ContentHealthStats {
  const total = sermons.length;
  if (total === 0) {
    return {
      totalSermons: 0,
      withAiSummary: 0,
      aiSummaryPercent: 0,
      withKeyVerses: 0,
      keyVersesPercent: 0,
      withAiTags: 0,
      aiTagsPercent: 0,
      withArtwork: 0,
      artworkPercent: 0,
    };
  }

  let withAiSummary = 0;
  let withKeyVerses = 0;
  let withAiTags = 0;
  let withArtwork = 0;

  for (const s of sermons) {
    if (s.ai_summary && s.ai_summary.trim().length > 0) withAiSummary++;
    if (s.key_verses && s.key_verses.length > 0) withKeyVerses++;
    if (s.ai_tags && s.ai_tags.length > 0) withAiTags++;
    if (s.artwork_url && s.artwork_url !== "ERROR" && s.artwork_url.trim().length > 0) withArtwork++;
  }

  return {
    totalSermons: total,
    withAiSummary,
    aiSummaryPercent: Math.round((withAiSummary / total) * 100),
    withKeyVerses,
    keyVersesPercent: Math.round((withKeyVerses / total) * 100),
    withAiTags,
    aiTagsPercent: Math.round((withAiTags / total) * 100),
    withArtwork,
    artworkPercent: Math.round((withArtwork / total) * 100),
  };
}

export interface SermonLeaderboardRow {
  id: string;
  title: string;
  date_preached: string;
  play_count?: number | null;
  download_count?: number | null;
  view_count?: number | null;
  preachers?: { name: string } | null;
  series?: { name: string } | null;
}

/**
 * Extracts the top N sermons sorted by the specified counter.
 */
export function extractTopSermons(
  rows: SermonLeaderboardRow[],
  metric: "play_count" | "download_count" | "view_count",
  limit = 3
): TopSermonItem[] {
  return [...rows]
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      title: s.title,
      date_preached: s.date_preached,
      preacher_name: s.preachers?.name || "Unknown Preacher",
      series_name: s.series?.name || null,
      count: s[metric] || 0,
    }));
}

// ── Database Aggregation Fetcher ─────────────────────────────────────────────

/**
 * Fetches all metrics and leaderboards for the overview dashboard.
 * Designed with defensive error handling so un-run migrations don't crash the page.
 */
export async function fetchOverviewStats(supabase: SupabaseClient<Database>): Promise<OverviewStatsData> {
  // 1. Fetch all sermons basic stats & health columns
  const { data: sermonsData, error: sermonsErr } = await supabase
    .from("sermons")
    .select("id, title, date_preached, play_count, download_count, view_count, ai_summary, key_verses, ai_tags, artwork_url, preachers(name), series(name)");

  if (sermonsErr) {
    throw new Error(`Failed to load sermons for overview: ${sermonsErr.message}`);
  }

  const sermons = (sermonsData ?? []) as unknown as SermonLeaderboardRow[];

  // Compute lifetime totals from sermon rows
  let lifetimePlays = 0;
  let lifetimeDownloads = 0;
  let lifetimeViews = 0;

  for (const s of sermons) {
    lifetimePlays += s.play_count || 0;
    lifetimeDownloads += s.download_count || 0;
    lifetimeViews += s.view_count || 0;
  }

  // 2. Fetch weekly events (past 7 days) from messages_stats_events (if table exists)
  const rawWeeklyCounts: RawEventCount[] = [];
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: eventsData, error: eventsErr } = await supabase
      .from("messages_stats_events")
      .select("event_type")
      .gte("created_at", sevenDaysAgo);

    if (!eventsErr && eventsData) {
      const counts: Record<string, number> = {};
      for (const row of eventsData) {
        counts[row.event_type] = (counts[row.event_type] || 0) + 1;
      }
      for (const [event_type, count] of Object.entries(counts)) {
        rawWeeklyCounts.push({ event_type, count });
      }
    }
  } catch {
    // Table not created yet; weekly counts gracefully default to 0
  }

  const metrics = calculateChannelMetrics(
    { plays: lifetimePlays, downloads: lifetimeDownloads, views: lifetimeViews },
    rawWeeklyCounts
  );

  const topPlayed = extractTopSermons(sermons, "play_count", 3);
  const topDownloaded = extractTopSermons(sermons, "download_count", 3);
  const topViewed = extractTopSermons(sermons, "view_count", 3);

  const health = calculateHealthStats(
    sermons.map((s) => ({
      ai_summary: (s as unknown as HealthCheckRow).ai_summary,
      key_verses: (s as unknown as HealthCheckRow).key_verses,
      ai_tags: (s as unknown as HealthCheckRow).ai_tags,
      artwork_url: (s as unknown as HealthCheckRow).artwork_url,
    }))
  );

  // 3. Count series & preachers
  const { count: seriesCount } = await supabase.from("series").select("*", { count: "exact", head: true });
  const { data: preachersData } = await supabase.from("preachers").select("id, name");

  // Preacher distribution from current sermons
  const preacherCounts: Record<string, number> = {};
  for (const s of sermons) {
    const name = s.preachers?.name || "Unknown";
    preacherCounts[name] = (preacherCounts[name] || 0) + 1;
  }
  const topPreachers = Object.entries(preacherCounts)
    .map(([name, sermonCount]) => ({ name, sermonCount }))
    .sort((a, b) => b.sermonCount - a.sermonCount)
    .slice(0, 5);

  // 4. Recent system errors (last 24 hours)
  let recentErrorsCount = 0;
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("messages_error_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);
    recentErrorsCount = count || 0;
  } catch {
    recentErrorsCount = 0;
  }

  return {
    metrics,
    topPlayed,
    topDownloaded,
    topViewed,
    health,
    totalSeries: seriesCount || 0,
    totalPreachers: preachersData?.length || 0,
    topPreachers,
    recentErrorsCount,
    generatedAt: new Date().toISOString(),
  };
}
