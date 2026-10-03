import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isMessagesAdmin } from "@/utils/supabase/admin";
import { getServiceClient } from "@/lib/server/service-client";
import { getErrorMessage } from "@/lib/utils";

// Admin-only: recent errors and recent admin activity for the Backups & logs tab.
// The log tables have no RLS policies, so they are read with the service role here.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isMessagesAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = getServiceClient();
    if (!db) return NextResponse.json({ installed: false, errors: [], activity: [] });

    const [errors, activity] = await Promise.all([
      db.from("messages_error_log")
        .select("id, created_at, source, message, path, context, digest")
        .order("created_at", { ascending: false })
        .limit(30),
      db.from("messages_admin_log")
        .select("id, created_at, actor_email, action, target_type, target_id")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    return NextResponse.json(
      {
        installed: !errors.error && !activity.error,
        errors: errors.data ?? [],
        activity: activity.data ?? [],
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[LOGS API] failed:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
