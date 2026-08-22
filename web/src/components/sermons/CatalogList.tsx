"use client";

import { useQuery } from "@tanstack/react-query";
import { SermonWithRelations } from "@/types/database";
import { SermonCard } from "./SermonCard";
import { Loader2 } from "lucide-react";
import type { FilterState } from "./FilterBar";

interface CatalogResponse {
  data: SermonWithRelations[];
  count: number;
  page: number;
  limit: number;
}

interface CatalogListProps {
  filters: FilterState;
}

export function CatalogList({ filters }: CatalogListProps) {
  const { data: response, isLoading, error } = useQuery<CatalogResponse>({
    queryKey: ['sermons', 'catalog', filters],
    queryFn: async () => {
      const url = new URL('/api/sermons', window.location.origin);
      if (filters.title) url.searchParams.set('title', filters.title);
      if (filters.preacher) url.searchParams.set('preacher', filters.preacher);
      if (filters.series) url.searchParams.set('series', filters.series);
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading catalog...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-20 text-red-500">
        <p>Failed to load catalog. Please try again.</p>
      </div>
    );
  }

  if (!response?.data || response.data.length === 0) {
    return (
      <div className="w-full text-center py-20 text-muted-foreground glass rounded-2xl">
        <p className="text-lg font-medium text-foreground mb-2">No sermons found</p>
        <p>Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {response.data.map((sermon) => (
        <SermonCard key={sermon.id} sermon={sermon} />
      ))}
    </div>
  );
}
