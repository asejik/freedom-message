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
      .from("preachers")
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
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Preacher name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if preacher already exists (case-insensitive)
    const { data: existing } = await (adminClient as any)
      .from("preachers")
      .select("*")
      .ilike("name", trimmedName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ data: existing, existed: true });
    }

    // Insert new preacher
    const { data, error } = await (adminClient as any)
      .from("preachers")
      .insert({ name: trimmedName })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, existed: false });

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
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: "Preacher ID is required" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Preacher name is required" }, { status: 400 });
    }

    const { data, error } = await (adminClient as any)
      .from("preachers")
      .update({ name: name.trim() })
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
      return NextResponse.json({ error: "Preacher ID is required" }, { status: 400 });
    }

    const { error } = await (adminClient as any)
      .from("preachers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
