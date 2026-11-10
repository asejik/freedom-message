/**
 * A small in-memory attempt limiter (the same approach as the AI search route's limiter).
 * It lives in one server instance's memory, so it slows guessing down rather than making
 * it impossible: a serverless platform may run several instances and restarts them.
 */
export function createAttemptLimiter(maxAttempts: number, windowMs: number, now: () => number = Date.now) {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  const current = (key: string) => {
    const entry = attempts.get(key);
    return entry && now() <= entry.resetTime ? entry : undefined;
  };

  return {
    /** True once `key` has used up its attempts for the current window. */
    isBlocked(key: string): boolean {
      return (current(key)?.count ?? 0) >= maxAttempts;
    },

    /** Counts one attempt against `key`. */
    record(key: string): void {
      // Periodic cleanup if the map grows
      if (attempts.size > 1000) {
        for (const [k, v] of attempts.entries()) {
          if (now() > v.resetTime) attempts.delete(k);
        }
      }
      const entry = current(key);
      if (entry) entry.count += 1;
      else attempts.set(key, { count: 1, resetTime: now() + windowMs });
    },

    /** Seconds until `key` may try again (0 if it isn't blocked). */
    retryAfterSeconds(key: string): number {
      const entry = current(key);
      return entry && entry.count >= maxAttempts ? Math.ceil((entry.resetTime - now()) / 1000) : 0;
    },
  };
}
