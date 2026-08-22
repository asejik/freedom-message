"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, SERMON_LIST_SELECT } from "@/lib/supabase";
import { SermonCard } from "@/components/sermons/SermonCard";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { SermonWithRelations } from "@/types/database";

export default function FavouritesPage() {
  const [favIds, setFavIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("favourite_sermons");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("favourite_sermons");
        if (stored) {
          setFavIds(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Could not read favourite_sermons from storage:", e);
      }
    };
    window.addEventListener("storage", handleStorage);
    setIsLoaded(true);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const { data: sermons, isLoading } = useQuery<SermonWithRelations[]>({
    queryKey: ["sermons", "favourites", favIds],
    enabled: isLoaded && favIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select(SERMON_LIST_SELECT)
        .in("id", favIds);

      if (error) throw error;
      return (data as unknown as SermonWithRelations[]) || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="w-full flex flex-col pb-[140px] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#030303]/90 backdrop-blur-xl w-full border-b border-white/5 px-4 sm:px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight">Favourites</h1>
            <p className="text-xs text-[#AAAAAA]">
              {favIds.length} {favIds.length === 1 ? "sermon" : "sermons"} saved to your library
            </p>
          </div>
        </div>

        {favIds.length > 0 && (
          <Link
            href="/"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Explore More
          </Link>
        )}
      </header>

      <div className="px-4 sm:px-6 md:px-12 py-6 sm:py-8">
        {!isLoaded || (isLoading && favIds.length > 0) ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="animate-spin text-white/40 w-8 h-8" />
          </div>
        ) : favIds.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center gap-5 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[40px] text-[#888888]">favorite_border</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="font-heading text-xl font-bold">No Favourites Yet</h2>
              <p className="text-sm text-[#AAAAAA] leading-relaxed">
                Save messages you love by clicking the three dots on any sermon card and selecting &quot;Save to Favourites&quot;.
              </p>
            </div>
            <Link
              href="/"
              className="mt-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md"
            >
              Browse Sermons
            </Link>
          </div>
        ) : (
          /* Grid of Favourites */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {(sermons ?? []).map((sermon, idx) => (
              <SermonCard key={sermon.id} sermon={sermon} index={idx} layout="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
