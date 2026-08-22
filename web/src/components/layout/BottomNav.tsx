"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: "home", href: "/" },
    { label: "Search", icon: "search", href: "/search" },
    { label: "Ask AI", icon: "smart_toy", href: "/ai" },
    { label: "Series", icon: "library_music", href: "/series" },
    { label: "Favourites", icon: "favorite", href: "/favourites" },
  ];

  return (
    <nav 
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-white/10 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 min-h-[48px] ${
                isActive
                  ? "text-primary font-semibold scale-105"
                  : "text-white/50 hover:text-white/80 active:scale-95"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
