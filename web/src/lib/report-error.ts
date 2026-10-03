/**
 * Sends a browser crash report to /api/report-error (stored in the admin error log).
 * Fire-and-forget: sends only the page path (no query string), message, digest and a
 * short stack, never anything the visitor typed.
 */
export function reportClientError(error: Error & { digest?: string }): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      message: error.message?.slice(0, 1000) || "Unknown error",
      digest: error.digest,
      path: window.location.pathname,
      stack: error.stack?.slice(0, 3000),
    });
    void fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting must never cause a second error
  }
}
