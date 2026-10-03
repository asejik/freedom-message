"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Bug, Loader2 } from "lucide-react";
import type { MessagesAdminLog, MessagesErrorLog } from "@/types/database";

type LogsResponse = {
  installed: boolean;
  errors: Pick<MessagesErrorLog, "id" | "created_at" | "source" | "message" | "path" | "context" | "digest">[];
  activity: Pick<MessagesAdminLog, "id" | "created_at" | "actor_email" | "action" | "target_type" | "target_id">[];
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Recent errors (server and browser) and recent admin activity, newest first. */
export function LogsPanel() {
  const { data, isLoading, isError, refetch } = useQuery<LogsResponse>({
    queryKey: ["admin", "logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logs", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load logs");
      return res.json();
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-white/40" aria-label="Loading logs" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-300">
        Couldn&apos;t load the logs.{" "}
        <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button>
      </p>
    );
  }

  if (!data.installed) {
    return <p className="text-sm text-white/60">Logs aren&apos;t installed yet (database update pending).</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="errors-heading" className="flex flex-col gap-3">
        <h2 id="errors-heading" className="text-base font-bold text-white flex items-center gap-2">
          <Bug size={17} aria-hidden="true" /> Recent errors
        </h2>
        {data.errors.length === 0 ? (
          <p className="text-sm text-white/60">No errors recorded in the last 90 days.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.errors.map((e) => (
              <li key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-white/60">
                  <span>{when(e.created_at)}</span>
                  <span className={e.source === "server" ? "text-amber-200" : "text-blue-300"}>{e.source}</span>
                  {e.path && <span className="font-mono">{e.path}</span>}
                </div>
                <p className="mt-1.5 text-white/90 break-words">{e.message}</p>
                {e.context && <p className="mt-1 text-white/50 font-mono break-words">{e.context}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="activity-heading" className="flex flex-col gap-3">
        <h2 id="activity-heading" className="text-base font-bold text-white flex items-center gap-2">
          <Activity size={17} aria-hidden="true" /> Recent admin activity
        </h2>
        {data.activity.length === 0 ? (
          <p className="text-sm text-white/60">No admin activity recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.activity.map((a) => (
              <li key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-white/60">{when(a.created_at)}</span>
                <span className="font-mono text-white/90">{a.action}</span>
                {a.target_id && <span className="font-mono text-white/50 break-all">{a.target_id}</span>}
                <span className="text-white/60">{a.actor_email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
