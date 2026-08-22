"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL CLIENT ERROR]:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-16 text-white relative z-10">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-lg">
        <span className="material-symbols-outlined text-[36px] sm:text-[44px] text-red-400">
          error_outline
        </span>
      </div>

      <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        Something Went Wrong
      </h1>

      <p className="text-sm sm:text-base text-[#AAAAAA] max-w-md mb-8 leading-relaxed">
        An unexpected error occurred while loading this page. You can try refreshing or return to the sermon catalog.
      </p>

      <div className="flex items-center gap-3.5 flex-wrap justify-center">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-full bg-white text-black text-xs sm:text-sm font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="px-6 py-2.5 rounded-full border border-white/20 text-white text-xs sm:text-sm font-medium hover:bg-white/10 active:scale-95 transition-all"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
