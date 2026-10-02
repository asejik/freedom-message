"use client";

/**
 * Shown when a data request fails, so a network or server problem is never
 * mistaken for "nothing found". Always offers a way to try again.
 */
export function LoadError({
  onRetry,
  message = "We couldn't load this right now. Check your connection and try again.",
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <div role="alert" className="py-12 flex flex-col items-center justify-center text-center gap-4 max-w-sm mx-auto">
      <span className="material-symbols-outlined text-[36px] text-[#888888]" aria-hidden="true">cloud_off</span>
      <p className="text-sm text-[#AAAAAA] leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md"
      >
        Try again
      </button>
    </div>
  );
}
