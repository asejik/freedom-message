import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Force dynamic execution for direct image uploads
export const dynamic = 'force-dynamic';

// Allowed image MIME types and their safe extension mapping
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const authClient = await createServerClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size exceeds maximum limit of 5MB." }, { status: 400 });
    }

    // 3. Validate Strict MIME Type & Derive Safe Extension
    const mimeType = (file.type || '').toLowerCase();
    const safeExtension = ALLOWED_MIME_TYPES[mimeType];

    if (!safeExtension) {
      return NextResponse.json(
        { error: "Invalid image format. Only JPEG, PNG, and WebP files are permitted." },
        { status: 400 }
      );
    }

    // 4. Initialize Admin Storage Client with Service Role Key (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase admin configuration missing.");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${randomUUID()}.${safeExtension}`;

    const { error: uploadError } = await adminClient.storage
      .from('artwork')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error("[UPLOAD ARTWORK] Storage error:", uploadError);
      return NextResponse.json({ error: "Failed to store image in storage bucket." }, { status: 500 });
    }

    const { data: { publicUrl } } = adminClient.storage
      .from('artwork')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error("[UPLOAD ARTWORK] Server error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
