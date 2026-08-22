import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return null;
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await (supabase as any)
      .from("series")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authClient = await createServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getAdminClient() || authClient;
    const body = await req.json();
    const { name, thumbnail_url } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Series name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedThumbnail = thumbnail_url && typeof thumbnail_url === "string" && thumbnail_url.trim() ? thumbnail_url.trim() : null;

    // Try inserting with thumbnail_url first
    if (trimmedThumbnail) {
      const { data, error } = await (adminClient as any)
        .from("series")
        .upsert({ name: trimmedName, thumbnail_url: trimmedThumbnail }, { onConflict: "name" })
        .select()
        .single();

      if (!error) {
        return NextResponse.json({ data });
      }
      console.warn("[SERIES API] Could not insert thumbnail_url, falling back to name only:", error.message);
    }

    // Fallback or default name-only insertion
    const { data: fallbackData, error: fallbackError } = await (adminClient as any)
      .from("series")
      .upsert({ name: trimmedName }, { onConflict: "name" })
      .select()
      .single();

    if (fallbackError) throw fallbackError;
    return NextResponse.json({ data: fallbackData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authClient = await createServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getAdminClient() || authClient;
    const body = await req.json();
    const { id, thumbnail_url, name } = body;

    if (!id) {
      return NextResponse.json({ error: "Series ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (thumbnail_url !== undefined) updatePayload.thumbnail_url = thumbnail_url ? thumbnail_url.trim() : null;
    if (name !== undefined) updatePayload.name = name.trim();

    const { data, error } = await (adminClient as any)
      .from("series")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authClient = await createServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getAdminClient() || authClient;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Series ID is required" }, { status: 400 });
    }

    const { error } = await (adminClient as any)
      .from("series")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
