"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Preacher, Series } from "@/types/database";

export interface FilterState {
  title: string;
  preacher: string;
  series: string;
  year: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  isLoading?: boolean;
}

function FilterChip({
  label,
  value,
  options,
  onSelect,
  onClear,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isActive = value !== "";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    // Calculate fixed position based on the button's position in viewport
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
    setSearch("");
    setOpen(true);
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-xs px-5 py-2 rounded-full border font-label-md text-label-md whitespace-nowrap transition-colors shrink-0 ${
          isActive
            ? "bg-primary text-white border-primary"
            : "text-on-surface-variant bg-white/40 border-outline-variant hover:bg-surface-container-low"
        }`}
      >
        {isActive ? value : label}
        {isActive ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="material-symbols-outlined text-[16px] hover:opacity-70 ml-1"
          >
            close
          </span>
        ) : (
          <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
        )}
      </button>

      {/* Fixed-position dropdown — renders outside overflow container */}
      {open && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] min-w-[240px] max-h-[350px] flex flex-col rounded-xl border border-outline-variant bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {options.length > 5 && (
            <div className="p-2 border-b border-surface-container shrink-0">
              <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant mr-2">search</span>
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${label}...`}
                  className="bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 py-1">
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full text-left px-4 py-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              All {label}s
            </button>
            <div className="border-t border-surface-container my-1" />
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-on-surface-variant text-center opacity-70">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { onSelect(opt.label); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 font-label-md text-label-md transition-colors hover:bg-surface-container-low ${
                    opt.label === value ? "text-primary font-bold bg-primary/5" : "text-on-background"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function FilterBar({ onFilterChange, isLoading }: FilterBarProps) {
  const supabase = createClient();
  const [filters, setFilters] = useState<FilterState>({ title: "", preacher: "", series: "", year: "" });
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const setFilter = useCallback(<K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    setFilters((prev) => ({ ...prev, [k]: v })), []);

  useEffect(() => {
    const t = setTimeout(() => onFilterChange(filters), 400);
    return () => clearTimeout(t);
  }, [filters, onFilterChange]);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const { data: preachers } = useQuery<Preacher[]>({
    queryKey: ["filter-preachers"],
    queryFn: async () => {
      const { data } = await supabase.from("preachers").select("*").order("name");
      return (data ?? []) as Preacher[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: series } = useQuery<Series[]>({
    queryKey: ["filter-series"],
    queryFn: async () => {
      const { data } = await supabase.from("series").select("*").order("name");
      return (data ?? []) as Series[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="sticky top-[64px] md:top-[64px] z-40 w-full glass-panel border-t-0 border-x-0 py-4 px-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1200px] mx-auto flex items-center gap-4">
        
        {searchOpen ? (
          <div className="flex flex-1 items-center gap-2 rounded-full border border-primary/40 bg-surface-container-lowest px-4 py-2 shadow-sm">
            <span className={`material-symbols-outlined text-primary text-[20px] ${isLoading ? "animate-pulse" : ""}`}>search</span>
            <input
              ref={searchRef}
              type="text"
              value={filters.title}
              onChange={(e) => setFilter("title", e.target.value)}
              placeholder="Search by title or phrase..."
              className="flex-1 bg-transparent font-body-md text-body-md text-on-background outline-none placeholder:text-outline"
            />
            <button onClick={() => { setFilter("title", ""); setSearchOpen(false); }} className="text-outline hover:text-primary">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={openSearch}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low text-primary hover:bg-surface-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        )}

        {!searchOpen && (
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full pb-1">
            <FilterChip
              label="Preacher"
              value={filters.preacher}
              options={(preachers ?? []).map((p) => ({ id: p.id, label: p.name }))}
              onSelect={(v) => setFilter("preacher", v)}
              onClear={() => setFilter("preacher", "")}
            />
            <FilterChip
              label="Series"
              value={filters.series}
              options={(series ?? []).map((s) => ({ id: s.id, label: s.name }))}
              onSelect={(v) => setFilter("series", v)}
              onClear={() => setFilter("series", "")}
            />
            <FilterChip
              label="Year"
              value={filters.year}
              options={Array.from({length: 12}, (_, i) => {
                const y = (new Date().getFullYear() - i).toString();
                return { id: y, label: y };
              })}
              onSelect={(v) => setFilter("year", v)}
              onClear={() => setFilter("year", "")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
