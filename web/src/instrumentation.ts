import type { Instrumentation } from "next";

// Records unhandled server errors (page renders, route handlers) in messages_error_log,
// visible under Admin → Backups & logs. Only the path is stored, never the query string.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { recordError } = await import("@/lib/server/logs");
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : null;
  await recordError({
    source: "server",
    error: err,
    digest,
    path: request.path,
    context: `${context.routeType} ${context.routePath}`,
  });
};
