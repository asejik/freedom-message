"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(input.trim());
  };

  const clear = () => {
    setInput("");
    onSearch("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center gap-sm glass-panel rounded-2xl px-6 py-4 shadow-sm border border-outline-variant/30 transition-all duration-300 ${input ? 'shadow-lg border-primary/40 bg-white/80 dark:bg-surface/80' : 'hover:shadow-md'}`}>
          <Search 
            size={24} 
            className={`text-primary transition-colors ${isLoading ? 'animate-pulse' : ''}`} 
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask what Pastor Tope taught about faith, prayer, grace, or revival..."
            className="flex-1 bg-transparent border-none outline-none text-on-background font-body-lg text-body-lg placeholder:text-on-surface-variant/60"
            aria-label="Search sermons"
          />
          {input && (
            <button
              type="button"
              onClick={clear}
              className="text-on-surface-variant hover:text-primary transition-colors mr-2"
              aria-label="Clear search"
            >
              <X size={20} />
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-shrink-0 bg-primary text-white font-label-md text-label-md px-6 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(0,67,142,0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>
      <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-4 opacity-70">
        Powered by AI — search by topic, preacher, or scripture
      </p>
    </div>
  );
}
