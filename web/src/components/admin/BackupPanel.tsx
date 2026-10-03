"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, DatabaseBackup, Download, Loader2 } from "lucide-react";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  daysUntilNextBackup,
  type BackupStatus,
} from "@/lib/backup/format";
import { getErrorMessage } from "@/lib/utils";

export const BACKUP_STATUS_KEY = ["admin", "backup-status"];

async function getJson<T>(url: string, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

export function useBackupStatus() {
  return useQuery<BackupStatus>({
    queryKey: BACKUP_STATUS_KEY,
    queryFn: () => getJson<BackupStatus>("/api/admin/backup?part=status", 1),
    staleTime: 60_000,
  });
}

/** "in 12 days" / "today" / "3 days ago" style text for the countdown. */
function describeDue(days: number): string {
  if (days > 1) return `due in ${days} days`;
  if (days === 1) return "due tomorrow";
  if (days === 0) return "due today";
  return `overdue by ${-days} day${days === -1 ? "" : "s"}`;
}

/** Compact reminder shown at the top of the admin dashboard on every visit. */
export function BackupReminder({ onOpen }: { onOpen: () => void }) {
  const { data: status } = useBackupStatus();
  if (!status) return null;

  const days = daysUntilNextBackup(status.lastBackupAt, new Date(), status.intervalDays);
  const tone =
    days === null || days < 0
      ? "bg-red-500/10 border-red-500/30 text-red-300"
      : days <= 7
        ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
        : "bg-white/[0.03] border-white/10 text-white/70";
  const text = !status.installed
    ? "Backups need a one-time database update before they can be tracked."
    : days === null
      ? "No backup yet. Download the first one now: the free database plan keeps no backups."
      : `Next monthly backup ${describeDue(days)} (last: ${new Date(status.lastBackupAt!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}).`;

  return (
    <div role="status" className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:text-sm ${tone}`}>
      <span className="flex items-center gap-2.5">
        <DatabaseBackup size={18} aria-hidden="true" className="shrink-0" />
        {text}
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="self-start sm:self-auto shrink-0 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        Go to backups
      </button>
    </div>
  );
}

type Meta = {
  exported_at: string;
  counts: { preachers: number; series: number; sermons: number };
  preachers: unknown[];
  series: unknown[];
  page_size: number;
};

/** Downloads every Messages record as one JSON file and records the backup. */
export function BackupPanel() {
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useBackupStatus();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const runBackup = async () => {
    setResult(null);
    setProgress({ done: 0, total: 0 });
    try {
      const meta = await getJson<Meta>("/api/admin/backup?part=meta");
      const total = meta.counts.sermons;
      const sermons: unknown[] = [];
      setProgress({ done: 0, total });

      for (let offset = 0; offset < total; offset += meta.page_size) {
        const page = await getJson<{ data: unknown[] }>(`/api/admin/backup?part=sermons&offset=${offset}`);
        sermons.push(...page.data);
        setProgress({ done: sermons.length, total });
        if (page.data.length === 0) break;
      }

      const counts = { preachers: meta.preachers.length, series: meta.series.length, sermons: sermons.length };
      const backup = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exported_at: meta.exported_at,
        source: window.location.origin,
        counts,
        preachers: meta.preachers,
        series: meta.series,
        sermons,
      };
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      const fileName = `messages-backup-${meta.exported_at.slice(0, 10)}.json`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 60_000);

      await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counts, bytes: blob.size }),
      });
      await queryClient.invalidateQueries({ queryKey: BACKUP_STATUS_KEY });
      await queryClient.invalidateQueries({ queryKey: ["admin", "logs"] });

      const mismatch = sermons.length !== total ? ` (expected ${total}; the catalog changed during the backup, so run it again to be safe)` : "";
      setResult({
        type: mismatch ? "error" : "success",
        msg: `Saved ${fileName}: ${counts.sermons} sermons, ${counts.series} series, ${counts.preachers} preachers, ${(blob.size / 1024 / 1024).toFixed(1)} MB${mismatch}. Keep it somewhere safe and private (e.g. a personal cloud drive), not in the GitHub repo.`,
      });
    } catch (err) {
      setResult({ type: "error", msg: `Backup failed: ${getErrorMessage(err)}. Nothing was recorded; please try again.` });
    } finally {
      setProgress(null);
    }
  };

  const days = status ? daysUntilNextBackup(status.lastBackupAt, new Date(), status.intervalDays) : null;
  const busy = progress !== null;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="backup-heading">
      <div>
        <h2 id="backup-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <DatabaseBackup size={18} aria-hidden="true" /> Monthly backup
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
          The free database plan keeps no backups. Once a month, download a copy of every sermon (with transcripts,
          summaries and verses), series and preacher. Artwork images are not included: they can be re-extracted from
          the MP3 files.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-white/80">
          {isLoading ? (
            "Checking last backup…"
          ) : !status?.installed ? (
            "Backup tracking isn't installed yet (database update pending). You can still download a backup."
          ) : status.lastBackupAt ? (
            <>
              Last backup:{" "}
              <strong className="text-white">
                {new Date(status.lastBackupAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </strong>
              {days !== null && (
                <span className={days < 0 ? "text-red-300" : days <= 7 ? "text-amber-200" : "text-white/60"}>
                  {" "}· next {describeDue(days)}
                </span>
              )}
            </>
          ) : (
            <span className="text-red-300">No backup recorded yet.</span>
          )}
        </div>
        <button
          type="button"
          onClick={runBackup}
          disabled={busy}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
          {busy ? "Preparing backup…" : "Download backup"}
        </button>
      </div>

      {busy && progress.total > 0 && (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="text-xs text-white/60">
            {progress.done} of {progress.total} sermons… keep this tab open.
          </p>
        </div>
      )}

      {result && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl flex items-start gap-2.5 text-sm ${result.type === "success" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25" : "bg-red-500/10 text-red-300 border border-red-500/25"}`}
        >
          {result.type === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" aria-hidden="true" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />}
          <span>{result.msg}</span>
        </div>
      )}
    </section>
  );
}
