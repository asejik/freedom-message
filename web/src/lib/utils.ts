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

/**
 * Shuffles a copy of `items` in an order fixed by `seed`: the server and the browser get the
 * same order for the same seed (a Math.random() shuffle would differ and break hydration).
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  // mulberry32: a small, fast seeded random number generator
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function artworkGradient(seed = ""): string {
  return GRADIENTS[hashString(seed) % GRADIENTS.length];
}

export function seriesAccent(seed = ""): string {
  return ACCENT_TEXTS[hashString(seed) % ACCENT_TEXTS.length];
}

// ── List paging ──────────────────────────────────────────────────────────────

/** Most rows one list request may return (series pages need the most: the largest has 54). */
export const MAX_LIST_LIMIT = 200;

/**
 * Reads `page` and `limit` query values for a list API. Missing values use the defaults
 * (page 1, 20 rows); a limit above MAX_LIST_LIMIT is lowered to it. Returns null for anything
 * that isn't a whole number of at least 1, so the route can answer 400 instead of failing.
 */
export function parsePaging(pageParam: string | null, limitParam: string | null): { page: number; limit: number } | null {
  const read = (value: string | null, fallback: number) => {
    if (value === null || value.trim() === "") return fallback;
    return /^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN;
  };
  const page = read(pageParam, 1);
  const limit = read(limitParam, 20);
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || page < 1 || limit < 1) return null;
  return { page, limit: Math.min(limit, MAX_LIST_LIMIT) };
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
 * A stored image URL if it's usable, else null. Some sermons hold "ERROR" instead of
 * artwork (left by the extraction script); a plain truthy check would render it.
 */
export function usableImageUrl(url: string | null | undefined): string | null {
  return isHttpUrl(url) ? url.trim() : null;
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
