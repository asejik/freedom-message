import { NextResponse } from "next/server";
import {
  validatePasscode,
  createTranscriptsSessionToken,
  verifyTranscriptsAccess,
  TRANSCRIPTS_COOKIE_NAME,
} from "@/lib/server/transcripts-auth";
import { createAttemptLimiter } from "@/lib/server/rate-limit";

// Wrong passcodes allowed per IP address before a pause (correct ones are never counted)
const wrongPasscodes = createAttemptLimiter(10, 15 * 60 * 1000);

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
};

export async function GET(request: Request) {
  const { authorized } = await verifyTranscriptsAccess(request);
  return NextResponse.json({ authenticated: authorized }, { headers: NO_CACHE_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { passcode, action } = body as { passcode?: string; action?: string };

    if (action === "logout") {
      const response = NextResponse.json(
        { success: true, authenticated: false },
        { headers: NO_CACHE_HEADERS }
      );
      response.cookies.set(TRANSCRIPTS_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    if (!passcode || typeof passcode !== "string") {
      return NextResponse.json(
        { error: "Access passcode is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "client-ip";
    if (wrongPasscodes.isBlocked(ip)) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please wait a few minutes and try again." },
        { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(wrongPasscodes.retryAfterSeconds(ip)) } }
      );
    }

    const isValid = validatePasscode(passcode);
    if (!isValid) {
      wrongPasscodes.record(ip);
      return NextResponse.json(
        { error: "Incorrect access code. Please try again." },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const token = createTranscriptsSessionToken(passcode.trim());
    const response = NextResponse.json(
      { success: true, authenticated: true },
      { headers: NO_CACHE_HEADERS }
    );

    response.cookies.set(TRANSCRIPTS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("[TRANSCRIPTS AUTH ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to authenticate." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
