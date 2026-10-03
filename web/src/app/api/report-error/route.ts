import { NextResponse } from "next/server";
import { recordError } from "@/lib/server/logs";

// Browser crash reports from the error boundary (app/error.tsx). Public, so it is
// strictly limited: small JSON only, per-IP rate limit, fields truncated before storage.

const MAX_BODY_BYTES = 8_000;
const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 5;
const recent = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (recent.size > 1000) {
    for (const [key, value] of recent) if (value.resetAt < now) recent.delete(key);
  }
  const entry = recent.get(ip);
  if (!entry || entry.resetAt < now) {
    recent.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REPORTS_PER_WINDOW;
}

const str = (value: unknown) => (typeof value === "string" ? value : null);

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return new NextResponse(null, { status: 429 });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const message = str(body.message);
  if (!message) return new NextResponse(null, { status: 400 });

  await recordError({
    source: "browser",
    error: message,
    digest: str(body.digest),
    path: str(body.path),
    stack: str(body.stack),
    userAgent: request.headers.get("user-agent"),
  });
  return new NextResponse(null, { status: 204 });
}
