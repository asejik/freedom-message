import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import { isMessagesAdmin } from "@/utils/supabase/admin";

export const TRANSCRIPTS_COOKIE_NAME = "messages_transcripts_auth";

/**
 * Returns the configured passcode for the private transcripts portal.
 */
export function getTranscriptsPasscode(): string {
  return (
    process.env.TRANSCRIPTS_ACCESS_PASSCODE?.trim() ||
    process.env.TRANSCRIPTS_ACCESS_KEY?.trim() ||
    ""
  );
}

/**
 * Validates a user-submitted passcode in constant time.
 */
export function validatePasscode(input: string): boolean {
  const target = getTranscriptsPasscode();
  if (!target || !input) return false;

  const a = Buffer.from(input.trim());
  const b = Buffer.from(target);

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Creates an HMAC token to store in the HTTP-only cookie.
 */
export function createTranscriptsSessionToken(passcode: string): string {
  const salt = "messages_transcripts_portal_salt_v1";
  return crypto.createHmac("sha256", salt).update(passcode).digest("hex");
}

/**
 * Verifies that the cookie value matches the expected hash of the current passcode.
 */
export function verifyTranscriptsSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const passcode = getTranscriptsPasscode();
  if (!passcode) return false;

  const expected = createTranscriptsSessionToken(passcode);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Extracts the cookie value from the request headers.
 */
export function extractTranscriptsCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${TRANSCRIPTS_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * High-level access check for transcripts API routes:
 * Authorized if:
 * 1. Valid private transcripts session cookie is present, OR
 * 2. User is authenticated as a verified Messages administrator.
 */
export async function verifyTranscriptsAccess(
  request: Request
): Promise<{ authorized: boolean; reason?: string }> {
  // 1. Check unit session cookie
  const cookieVal = extractTranscriptsCookie(request);
  if (cookieVal && verifyTranscriptsSessionToken(cookieVal)) {
    return { authorized: true };
  }

  // 2. Fall back to check if request is from a logged-in admin
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && isMessagesAdmin(user)) {
      return { authorized: true };
    }
  } catch {
    // Auth check error; fall through to unauthorized
  }

  return { authorized: false, reason: "Unauthorized: Invalid or missing transcripts passcode." };
}
