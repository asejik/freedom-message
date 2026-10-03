import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isMessagesAdmin } from "@/utils/supabase/admin";
import { getServiceClient } from "@/lib/server/service-client";
import { logAdminAction } from "@/lib/server/logs";
import { getErrorMessage } from "@/lib/utils";
import { BACKUP_INTERVAL_DAYS, BACKUP_PAGE_SIZE, SERMON_BACKUP_COLUMNS, type BackupStatus } from "@/lib/backup/format";

// Admin-only data export for the monthly backup (Supabase Free has no automatic backups).
// The browser downloads it in pages and saves one JSON file locally:
//   GET  ?part=status          when the last backup was (for the dashboard countdown)
//   GET  ?part=meta            preachers, series and counts
//   GET  ?part=sermons&offset= a page of full sermon rows (transcripts included)
//   POST                       records a completed backup in the audit log

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isMessagesAdmin(user)) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { supabase, user };
}

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const params = new URL(request.url).searchParams;
    const part = params.get("part");

    if (part === "status") {
      const db = getServiceClient();
      const status: BackupStatus = { installed: false, lastBackupAt: null, intervalDays: BACKUP_INTERVAL_DAYS };
      if (db) {
        const { data, error } = await db
          .from("messages_admin_log")
          .select("created_at")
          .eq("action", "backup.download")
          .order("created_at", { ascending: false })
          .limit(1);
        if (!error) {
          status.installed = true;
          status.lastBackupAt = data?.[0]?.created_at ?? null;
        }
      }
      return NextResponse.json(status, { headers: PRIVATE_NO_STORE });
    }

    if (part === "meta") {
      const [preachers, series, sermons] = await Promise.all([
        supabase.from("preachers").select("*").order("name"),
        supabase.from("series").select("*").order("name"),
        supabase.from("sermons").select("id", { count: "exact", head: true }),
      ]);
      if (preachers.error) throw preachers.error;
      if (series.error) throw series.error;
      if (sermons.error) throw sermons.error;
      return NextResponse.json(
        {
          exported_at: new Date().toISOString(),
          counts: { preachers: preachers.data.length, series: series.data.length, sermons: sermons.count ?? 0 },
          preachers: preachers.data,
          series: series.data,
          page_size: BACKUP_PAGE_SIZE,
        },
        { headers: PRIVATE_NO_STORE }
      );
    }

    if (part === "sermons") {
      const offset = Math.max(0, parseInt(params.get("offset") || "0", 10) || 0);
      const { data, error } = await supabase
        .from("sermons")
        .select(SERMON_BACKUP_COLUMNS)
        .order("id")
        .range(offset, offset + BACKUP_PAGE_SIZE - 1);
      if (error) throw error;
      return NextResponse.json({ data: data ?? [] }, { headers: PRIVATE_NO_STORE });
    }

    return NextResponse.json({ error: "Unknown part" }, { status: 400 });
  } catch (error) {
    console.error("[BACKUP API] export failed:", error);
    return NextResponse.json({ error: getErrorMessage(error) || "Backup export failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const body = (await request.json().catch(() => ({}))) as { counts?: unknown; bytes?: unknown };
    const counts = typeof body.counts === "object" && body.counts !== null ? body.counts : {};
    const bytes = typeof body.bytes === "number" ? body.bytes : null;
    await logAdminAction(auth.user, "backup.download", { type: "backup", id: null }, { counts, bytes });
    return NextResponse.json({ recorded_at: new Date().toISOString() });
  } catch (error) {
    console.error("[BACKUP API] could not record backup:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
