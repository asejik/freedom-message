"use client";

export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#030303]/95 backdrop-blur-xl border-b border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        {/* FM logo pill */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: "linear-gradient(135deg, #6C63FF 0%, #3ECFCF 100%)" }}
        >
          <span className="text-white font-black text-xs tracking-tighter">FM</span>
        </div>
        <span className="font-heading font-bold text-white text-lg tracking-tight leading-none">
          Freedom Messages
        </span>
      </div>
    </header>
  );
}
