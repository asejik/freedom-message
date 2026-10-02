import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { isMessagesAdmin } from '@/utils/supabase/admin';
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

/** Identifies JPEG / PNG / WebP by their leading signature bytes; null for anything else. */
function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const authClient = await createServerClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isMessagesAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // 3. Validate the real file type from its contents (the browser-declared
    //    file.type is attacker-controlled) & derive a safe extension
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectImageMime(buffer);
    const safeExtension = mimeType ? ALLOWED_MIME_TYPES[mimeType] : undefined;

    if (!mimeType || !safeExtension) {
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

    const fileName = `${randomUUID()}.${safeExtension}`;

    const { error: uploadError } = await adminClient.storage
      .from('artwork')
      .upload(fileName, buffer, {
        contentType: mimeType,
        // Unique filename that is never overwritten, so browsers/CDN can keep it for a year
        cacheControl: '31536000',
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
