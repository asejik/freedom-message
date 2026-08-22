import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  }
  return null;
}

/**
 * POST /api/admin/series/merge
 * Body: { canonical_id: string, duplicate_ids: string[] }
 *
 * Steps:
 * 1. Re-parent all sermons from duplicate_ids → canonical_id
 * 2. Delete the duplicate series rows
 */
export async function POST(req: Request) {
  try {
    const authClient = await createServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Server misconfiguration: admin client unavailable" }, { status: 500 });
    }

    const body = await req.json();
    const { canonical_id, duplicate_ids } = body as { canonical_id: string; duplicate_ids: string[] };

    if (!canonical_id || typeof canonical_id !== "string") {
      return NextResponse.json({ error: "canonical_id is required" }, { status: 400 });
    }
    if (!Array.isArray(duplicate_ids) || duplicate_ids.length === 0) {
      return NextResponse.json({ error: "duplicate_ids must be a non-empty array" }, { status: 400 });
    }

    // Guard: don't let canonical be in duplicates
    const idsToRemove = duplicate_ids.filter(id => id !== canonical_id);
    if (idsToRemove.length === 0) {
      return NextResponse.json({ error: "No valid duplicates to merge" }, { status: 400 });
    }

    // 1. Re-parent sermons: update series_id for all sermons pointing at duplicates
    const { error: updateError, data: movedRows } = await adminClient
      .from("sermons")
      .update({ series_id: canonical_id })
      .in("series_id", idsToRemove)
      .select("id");

    if (updateError) {
      console.error("[MERGE SERIES] Failed to re-parent sermons:", updateError);
      return NextResponse.json({ error: `Failed to re-parent sermons: ${updateError.message}` }, { status: 500 });
    }

    // 2. Delete duplicate series rows
    const { error: deleteError } = await adminClient
      .from("series")
      .delete()
      .in("id", idsToRemove);

    if (deleteError) {
      console.error("[MERGE SERIES] Failed to delete duplicates:", deleteError);
      return NextResponse.json({ error: `Sermons re-parented but failed to delete duplicates: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sermons_moved: movedRows?.length ?? 0,
      removed_series_count: idsToRemove.length,
    });

  } catch (error: any) {
    console.error("[MERGE SERIES] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
