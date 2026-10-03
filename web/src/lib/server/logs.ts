import type { User } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/server/service-client";
import { getErrorMessage } from "@/lib/utils";

// Writes to the messages_admin_log / messages_error_log tables. Logging must never
// break the request it describes, so every failure here is swallowed (and printed
// to the server log). Until the 2026-10-03_4 migration runs, inserts simply fail.

const clip = (value: string | null | undefined, max: number) => (value ? value.slice(0, max) : null);

/** Path without the query string (queries can contain what visitors typed into search). */
export function pathOnly(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  const path = pathOrUrl.startsWith("http") ? new URL(pathOrUrl).pathname : pathOrUrl.split("?")[0];
  return clip(path, 300);
}

/** Records one admin action in the append-only audit log. */
export async function logAdminAction(
  user: User,
  action: string,
  target: { type: string; id?: string | null } | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const db = getServiceClient();
    if (!db) return;
    const { error } = await db.from("messages_admin_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: action.slice(0, 64),
      target_type: target?.type ?? null,
      target_id: clip(target?.id ?? null, 200),
      details,
    });
    if (error) console.error("[ADMIN LOG] not recorded:", error.message);
  } catch (err) {
    console.error("[ADMIN LOG] not recorded:", getErrorMessage(err));
  }
}

const ERROR_RETENTION_DAYS = 90;

/** Records an error in messages_error_log, occasionally pruning reports older than 90 days. */
export async function recordError(entry: {
  source: "server" | "browser";
  error: unknown;
  path?: string | null;
  context?: string | null;
  userAgent?: string | null;
  stack?: string | null;
  digest?: string | null;
}): Promise<void> {
  try {
    const db = getServiceClient();
    if (!db) return;
    const stack = entry.stack ?? (entry.error instanceof Error ? entry.error.stack ?? null : null);
    const { error } = await db.from("messages_error_log").insert({
      source: entry.source,
      message: clip(getErrorMessage(entry.error), 1000) ?? "Unknown error",
      digest: clip(entry.digest ?? null, 100),
      path: pathOnly(entry.path),
      context: clip(entry.context ?? null, 200),
      user_agent: clip(entry.userAgent ?? null, 300),
      stack: clip(stack, 4000),
    });
    if (error) {
      console.error("[ERROR LOG] not recorded:", error.message);
      return;
    }
    // Keep the table small without a scheduler: prune on roughly 1 insert in 20
    if (Math.random() < 0.05) {
      const cutoff = new Date(Date.now() - ERROR_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await db.from("messages_error_log").delete().lt("created_at", cutoff);
    }
  } catch (err) {
    console.error("[ERROR LOG] not recorded:", getErrorMessage(err));
  }
}
