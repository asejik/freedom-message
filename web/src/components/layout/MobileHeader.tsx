"use client";

import Link from "next/link";

export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#030303]/95 backdrop-blur-xl border-b border-white/5">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5">
        <img
          src="/logo.PNG"
          alt="Freedom Messages"
          className="w-8 h-8 object-contain shrink-0"
        />
        <span className="font-heading font-bold text-white text-lg tracking-tight leading-none">
          Freedom Messages
        </span>
      </Link>
    </header>
  );
}
