"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SermonCard } from "@/components/sermons/SermonCard";
import { Loader2 } from "lucide-react";
import type { SermonWithRelations } from "@/types/database";

const CARD_WIDTH = 220;

export function SermonShelf({
  title,
  subtitle,
  sermons,
  isLoading,
}: {
  title: string;
  subtitle: string;
  sermons?: SermonWithRelations[];
  isLoading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        ref.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [sermons, checkScroll]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = CARD_WIDTH * 3;
    scrollRef.current.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  }, [checkScroll]);

  return (
    <section>
      <p className="text-[#AAAAAA] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">{subtitle}</p>
      <div className="flex items-center justify-between mb-3.5 sm:mb-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
        <div className="hidden sm:flex gap-2">
          {/* Back/Previous button: greyed out by default until scrolled */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              !canScrollLeft
                ? "opacity-30 border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/20 text-white hover:bg-white/10 active:scale-95 cursor-pointer"
            }`}
            title="Scroll left"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          {/* Next button */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              !canScrollRight
                ? "opacity-30 border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/20 text-white hover:bg-white/10 active:scale-95 cursor-pointer"
            }`}
            title="Scroll right"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[220px] sm:h-[260px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3.5 sm:gap-5 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12"
        >
          {sermons?.map((sermon, idx) => (
            <SermonCard key={sermon.id} sermon={sermon} index={idx} layout="shelf" />
          ))}
        </div>
      )}
    </section>
  );
}
