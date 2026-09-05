"use client";

import Link from "next/link";

export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#030303]/95 backdrop-blur-xl border-b border-white/5">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5">
        <img
          src="/mami.png"
          alt="Messages"
          className="h-8 sm:h-9 w-auto object-contain shrink-0"
        />
        <span className="font-heading font-bold text-white text-lg tracking-tight leading-none">
          Messages
        </span>
      </Link>
    </header>
  );
}
