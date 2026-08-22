"use client";

import { useQuery } from "@tanstack/react-query";
import { SermonWithRelations } from "@/types/database";
import { SermonCard } from "./SermonCard";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface SermonListProps {
  searchQuery: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function SermonList({ searchQuery, onLoadingChange }: SermonListProps) {
  const { data: sermons, isLoading, error } = useQuery<SermonWithRelations[]>({
    queryKey: ['sermons', 'search', searchQuery],
    queryFn: async () => {
      const url = new URL('/api/search', window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.set('q', searchQuery.trim());
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });

  // Report loading state up to parent (for the search bar indicator)
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Searching through archives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-20 text-red-500">
        <p>Failed to load sermons. Please try again.</p>
      </div>
    );
  }

  if (!sermons || sermons.length === 0) {
    return (
      <div className="w-full text-center py-20 text-muted-foreground glass rounded-2xl">
        <p className="text-lg font-medium text-foreground mb-2">No sermons found</p>
        <p>Try adjusting your search terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sermons.map((sermon) => (
        <SermonCard key={sermon.id} sermon={sermon} />
      ))}
    </div>
  );
}
