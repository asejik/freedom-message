"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Download,
  Eye,
  TrendingUp,
  Award,
  Sparkles,
  BookOpen,
  Users,
  Layers,
  RefreshCw,
  Loader2,
  FileText,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { OverviewStatsData, TopSermonItem } from "@/lib/server/overview";
import { LoadError } from "@/components/ui/LoadError";

function MetricCard({
  title,
  icon: Icon,
  weekly,
  lifetime,
  color,
}: {
  title: string;
  icon: typeof Play;
  weekly: number;
  lifetime: number;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      text: "text-purple-400",
      badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
  }[color];

  return (
    <div className="bg-[#121316] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${colorMap.bg} ${colorMap.border} border flex items-center justify-center ${colorMap.text} shrink-0`}>
          <Icon size={18} />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {lifetime.toLocaleString()}
          </span>
          <span className="text-xs text-white/40 font-medium">lifetime</span>
        </div>

        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-white/50">Past 7 days:</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${colorMap.badge}`}>
            {weekly > 0 ? `+${weekly.toLocaleString()}` : "0"} this week
          </span>
        </div>
      </div>
    </div>
  );
}

function TopSermonsCard({
  title,
  icon: Icon,
  items,
  badgeUnit,
  color,
}: {
  title: string;
  icon: typeof Play;
  items: TopSermonItem[];
  badgeUnit: string;
  color: "blue" | "emerald" | "purple";
}) {
  const medalColors = [
    "bg-amber-400/20 text-amber-300 border-amber-400/30",
    "bg-slate-300/20 text-slate-200 border-slate-300/30",
    "bg-amber-700/20 text-amber-500 border-amber-700/30",
  ];

  const iconColors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  }[color];

  return (
    <div className="bg-[#121316] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm">
      <div className="flex items-center gap-2.5 pb-3.5 border-b border-white/10">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconColors}`}>
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          <p className="text-[11px] text-white/50">All-time top ranking messages</p>
        </div>
      </div>

      <div className="divide-y divide-white/5 mt-2 flex-1">
        {items.length === 0 ? (
          <p className="text-xs text-white/40 py-6 text-center">No recorded activity yet</p>
        ) : (
          items.map((item, idx) => (
            <div key={item.id || idx} className="py-3 flex items-start justify-between gap-3 group">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 mt-0.5 ${
                    medalColors[idx] || "bg-white/10 text-white/60 border-white/10"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">
                    {item.preacher_name}
                    {item.series_name ? ` • ${item.series_name}` : ""}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-white block">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider block">
                  {badgeUnit}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  count,
  total,
  percent,
  icon: Icon,
}: {
  label: string;
  count: number;
  total: number;
  percent: number;
  icon: typeof FileText;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70 flex items-center gap-1.5 font-medium">
          <Icon size={14} className="text-white/40" />
          {label}
        </span>
        <span className="text-white font-semibold">
          {percent}% <span className="text-white/40 font-normal">({count}/{total})</span>
        </span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

export function OverviewPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<OverviewStatsData>({
    queryKey: ["admin", "overview-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed to load channel statistics");
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-white/40">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-xs font-medium">Loading channel statistics...</p>
      </div>
    );
  }

  if (isError || !data) {
    return <LoadError onRetry={() => refetch()} />;
  }

  const { metrics, topPlayed, topDownloaded, topViewed, health, topPreachers, recentErrorsCount, totalSeries, totalPreachers } = data;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Award className="text-blue-400" size={20} />
            Channel Performance & Statistics
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Real-time listener activity, download trends, catalog enrichment, and rankings.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          <span>{isFetching ? "Refreshing..." : "Refresh Stats"}</span>
        </button>
      </div>

      {/* ── 1. Top Channel Metrics (Views, Plays, Downloads, Engagement) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Number of Views"
          icon={Eye}
          weekly={metrics.views.weekly}
          lifetime={metrics.views.lifetime}
          color="purple"
        />
        <MetricCard
          title="Number of Plays"
          icon={Play}
          weekly={metrics.plays.weekly}
          lifetime={metrics.plays.lifetime}
          color="blue"
        />
        <MetricCard
          title="Number of Downloads"
          icon={Download}
          weekly={metrics.downloads.weekly}
          lifetime={metrics.downloads.lifetime}
          color="emerald"
        />
        <MetricCard
          title="Total Engagement"
          icon={TrendingUp}
          weekly={metrics.totalEngagement.weekly}
          lifetime={metrics.totalEngagement.lifetime}
          color="amber"
        />
      </div>

      {/* ── 2. Top 3 Sermons in All Categories ── */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <Award className="text-amber-400" size={17} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top 3 Leaderboards</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TopSermonsCard
            title="Top 3 Most Played"
            icon={Play}
            items={topPlayed}
            badgeUnit="plays"
            color="blue"
          />
          <TopSermonsCard
            title="Top 3 Most Downloaded"
            icon={Download}
            items={topDownloaded}
            badgeUnit="downloads"
            color="emerald"
          />
          <TopSermonsCard
            title="Top 3 Most Viewed"
            icon={Eye}
            items={topViewed}
            badgeUnit="views"
            color="purple"
          />
        </div>
      </div>

      {/* ── 3. Extra High-Value Statistics: Catalog Health & Preachers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Content Quality & Enrichment Coverage */}
        <div className="bg-[#121316] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Catalog Enrichment Health</h3>
            </div>
            <span className="text-xs text-white/40">{health.totalSermons.toLocaleString()} total sermons</span>
          </div>

          <div className="space-y-3.5">
            <ProgressBar
              label="AI Summaries Generated"
              count={health.withAiSummary}
              total={health.totalSermons}
              percent={health.aiSummaryPercent}
              icon={FileText}
            />
            <ProgressBar
              label="Key Scriptures / Verses"
              count={health.withKeyVerses}
              total={health.totalSermons}
              percent={health.keyVersesPercent}
              icon={BookOpen}
            />
            <ProgressBar
              label="Topic Tags Assigned"
              count={health.withAiTags}
              total={health.totalSermons}
              percent={health.aiTagsPercent}
              icon={Bookmark}
            />
            <ProgressBar
              label="Custom Artwork Coverage"
              count={health.withArtwork}
              total={health.totalSermons}
              percent={health.artworkPercent}
              icon={Layers}
            />
          </div>
        </div>

        {/* Catalog Breakdown & System Health */}
        <div className="space-y-4">
          {/* Top Preachers Contribution */}
          <div className="bg-[#121316] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users size={17} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Top Contributing Ministers</h3>
              </div>
              <span className="text-xs text-white/40">{totalPreachers} registered</span>
            </div>

            <div className="space-y-2">
              {topPreachers.slice(0, 4).map((p) => {
                const ratio = health.totalSermons > 0 ? Math.round((p.sermonCount / health.totalSermons) * 100) : 0;
                return (
                  <div key={p.name} className="flex items-center justify-between text-xs py-1">
                    <span className="text-white/80 font-medium truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-white font-bold">{p.sermonCount}</span>
                      <span className="text-white/40 text-[10px]">({ratio}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick System & Archive Snapshot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#121316] border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Layers size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/40 uppercase font-semibold">Series Archive</p>
                <p className="text-sm font-bold text-white mt-0.5">{totalSeries} series</p>
              </div>
            </div>

            <div className="bg-[#121316] border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  recentErrorsCount === 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {recentErrorsCount === 0 ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/40 uppercase font-semibold">Errors (24h)</p>
                <p className={`text-sm font-bold mt-0.5 ${recentErrorsCount === 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {recentErrorsCount === 0 ? "Healthy (0)" : `${recentErrorsCount} logged`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
