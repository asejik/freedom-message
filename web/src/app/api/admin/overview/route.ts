import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isMessagesAdmin } from "@/utils/supabase/admin";
import { getServiceClient } from "@/lib/server/service-client";
import { fetchOverviewStats } from "@/lib/server/overview";
import { recordError } from "@/lib/server/logs";
import { getErrorMessage } from "@/lib/utils";

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

    const db = getServiceClient() || auth.supabase;
    const stats = await fetchOverviewStats(db);

    return NextResponse.json(stats, { headers: PRIVATE_NO_STORE });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("[ADMIN OVERVIEW ERROR]:", message);
    await recordError({ source: "server", error, path: request.url, context: "route /api/admin/overview" });
    return NextResponse.json(
      { error: "Could not load channel statistics." },
      { status: 500 }
    );
  }
}
