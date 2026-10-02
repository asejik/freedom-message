// Shared gradient and accent utilities used across the app

const GRADIENTS = [
  "from-blue-900 to-indigo-800",
  "from-violet-900 to-purple-800",
  "from-rose-900 to-pink-800",
  "from-amber-900 to-orange-800",
  "from-teal-900 to-cyan-800",
  "from-emerald-900 to-green-800",
  "from-sky-900 to-blue-800",
  "from-fuchsia-900 to-pink-800",
];

const ACCENT_TEXTS = [
  "text-blue-400",
  "text-violet-400",
  "text-rose-400",
  "text-amber-400",
  "text-teal-400",
  "text-emerald-400",
  "text-sky-400",
  "text-fuchsia-400",
];

function hashString(seed = ""): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return h;
}

export function artworkGradient(seed = ""): string {
  return GRADIENTS[hashString(seed) % GRADIENTS.length];
}

export function seriesAccent(seed = ""): string {
  return ACCENT_TEXTS[hashString(seed) % ACCENT_TEXTS.length];
}

// ── URL safety ───────────────────────────────────────────────────────────────

/** True only for absolute http(s) URLs. Rejects javascript:, data:, etc. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const { protocol } = new URL(value.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Opens a stored URL in a new tab, but only if it is http(s).
 * window.open() would otherwise execute a `javascript:` URL on our origin.
 */
export function openExternalUrl(url: string | null | undefined): void {
  if (isHttpUrl(url)) window.open(url, "_blank", "noopener,noreferrer");
}

// ── Errors ───────────────────────────────────────────────────────────────────

/**
 * Message from anything that can be thrown. Supabase throws plain objects with a
 * `message` field rather than Error instances, so both shapes are handled.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return String(err);
}
