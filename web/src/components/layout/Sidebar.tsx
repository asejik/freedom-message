"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: "home", href: "/" },
    { label: "Ask AI", icon: "smart_toy", href: "/ai" },
    { label: "Series", icon: "library_music", href: "/series" },
    { label: "Favourites", icon: "favorite", href: "/favourites" },
  ];

  return (
    <aside className="hidden md:flex w-[72px] lg:w-[240px] flex-shrink-0 h-full flex-col bg-[#030303] text-white pt-4 pb-4 z-30 transition-all duration-300 relative border-r border-white/5">
      
      {/* Brand */}
      <Link href="/" className="px-2 lg:px-6 mb-8 flex items-center justify-center lg:justify-start gap-3 group">
        <img
          src="/logo.PNG"
          alt="Freedom Messages"
          className="h-[42px] w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
        <span className="hidden lg:block font-heading font-bold text-xl tracking-tight text-white leading-none">
          Freedom Messages
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-2 lg:px-3 flex flex-col gap-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-white/10 text-white font-semibold shadow-sm" 
                  : "text-[#AAAAAA] hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="hidden lg:block text-sm">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main Website Link */}
      <div className="p-2 lg:p-3 border-t border-white/5 mt-auto">
        <a
          href="https://www.muyiwaareo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#AAAAAA] hover:text-white transition-all group active:scale-95"
          title="Visit Main Website (muyiwaareo.com)"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center text-primary group-hover:text-white shrink-0 transition-colors">
            <span className="material-symbols-outlined text-[18px]">language</span>
          </div>
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              Main Website
              <span className="material-symbols-outlined text-[13px] opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                open_in_new
              </span>
            </span>
            <span className="text-[10px] text-[#888888] truncate">muyiwaareo.com</span>
          </div>
        </a>
      </div>

    </aside>
  );
}
