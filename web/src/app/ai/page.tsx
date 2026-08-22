"use client";

import { useState, useEffect } from "react";
import { SermonCard } from "@/components/sermons/SermonCard";
import { Loader2, X, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { SermonWithRelations } from "@/types/database";

const THINKING_MESSAGES = [
  "Analyzing your request...",
  "Extracting core topics...",
  "Searching sermon database...",
  "Ranking relevance...",
  "Generating conversational response..."
];

function FormattedAIAnswer({ text }: { text: string }) {
  if (!text) return null;

  // Normalize line breaks and remove raw markdown bold asterisks
  const normalized = text
    .replace(/\*\*/g, '') // remove bold asterisks
    .replace(/(\.|\:)\s+\*\s*(?=[“"A-Z0-9])/g, '$1\n• ') // convert inline "* Title" after punctuation to newline bullet
    .replace(/\s+\*\s*(?=[“"A-Z0-9])/g, '\n• ')
    .replace(/\n\s*[\*\-]\s+/g, '\n• '); // standardise bullet points

  const rawLines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
  
  const introLines: string[] = [];
  const bulletLines: string[] = [];
  const conclusionLines: string[] = [];

  let state: 'intro' | 'bullets' | 'conclusion' = 'intro';

  for (const line of rawLines) {
    const isBullet = line.startsWith('•') || /^\d+[\.\)]\s+/.test(line);
    if (isBullet) {
      state = 'bullets';
      bulletLines.push(line.replace(/^[•\d\.\)\-\*]\s*/, '').trim());
    } else if (state === 'bullets') {
      state = 'conclusion';
      conclusionLines.push(line);
    } else if (state === 'conclusion') {
      conclusionLines.push(line);
    } else {
      introLines.push(line);
    }
  }

  return (
    <div className="space-y-3.5 leading-relaxed text-[15px]">
      {introLines.length > 0 && (
        <div className="space-y-2">
          {introLines.map((line, idx) => (
            <p key={`intro-${idx}`} className="text-white/95">{line}</p>
          ))}
        </div>
      )}

      {bulletLines.length > 0 && (
        <ul className="space-y-3 my-3 pl-1">
          {bulletLines.map((bullet, idx) => {
            // Check if there's a title separator (–, -, —, or :)
            const separatorMatch = bullet.match(/^([“"'].+?[”"']|[^\–\—\-:]+?)(\s*[\–\—\-:]\s*)(.+)$/);
            if (separatorMatch) {
              const [, title, , desc] = separatorMatch;
              return (
                <li key={`bullet-${idx}`} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0 shadow-sm shadow-blue-400/50" />
                  <div className="text-white/90">
                    <span className="font-semibold text-white">{title.trim()}</span>
                    <span className="text-white/40 mx-2">—</span>
                    <span className="text-white/80">{desc.trim()}</span>
                  </div>
                </li>
              );
            }
            return (
              <li key={`bullet-${idx}`} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0 shadow-sm shadow-blue-400/50" />
                <span className="text-white/90">{bullet}</span>
              </li>
            );
          })}
        </ul>
      )}

      {conclusionLines.length > 0 && (
        <div className="space-y-2 pt-2.5 border-t border-white/10 text-white/80 text-sm">
          {conclusionLines.map((line, idx) => (
            <p key={`conclusion-${idx}`}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AskAIPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<SermonWithRelations[] | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      setThinkingIndex(0);
      interval = setInterval(() => {
        setThinkingIndex((prev) => Math.min(prev + 1, THINKING_MESSAGES.length - 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    setResults(null);
    setAnswer(null);
    setSubmitted(query);
    try {
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.set("q", query);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setResults(json.results ?? (Array.isArray(json) ? json : [])); // fallback in case old api format hits
      setAnswer(json.answer ?? null);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setAnswer(null);
    setSubmitted("");
    setError(null);
  };

  return (
    <div className="w-full flex flex-col pb-[120px] text-white">
      <header className="sticky top-0 z-40 bg-[#030303]/90 backdrop-blur-xl w-full h-14 sm:h-[72px] flex items-center px-4 sm:px-6 border-b border-white/5">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">Ask AI</h1>
      </header>

      <div className="px-4 sm:px-6 md:px-12 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">What are you looking for?</h2>
          <p className="text-[#AAAAAA] text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">
            Ask a question or describe a topic. Our AI will search all transcripts and generate answers with sermon recommendations.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. sermons about faith in difficult times..."
                className="w-full bg-white/10 border border-white/10 rounded-xl sm:rounded-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-3 text-xs sm:text-sm text-white placeholder:text-[#AAAAAA] outline-none focus:border-white/30 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 bg-white text-black font-semibold rounded-xl sm:rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              {isSearching ? <Loader2 className="animate-spin w-4 h-4" /> : null}
              <span>{isSearching ? "Searching..." : "Search"}</span>
            </button>
          </form>
          
          {isSearching && (
            <div className="flex items-center gap-2.5 text-primary bg-primary/10 w-max px-3.5 py-1.5 rounded-full mt-3.5 transition-all duration-300">
              <Loader2 className="animate-spin w-3.5 h-3.5" />
              <span className="text-xs sm:text-sm font-medium animate-pulse">{THINKING_MESSAGES[thinkingIndex]}</span>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-xs sm:text-sm">{error}</p>}

        {results !== null && !isSearching && (
          <section className="flex flex-col gap-6">
            {answer && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-4xl relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="w-24 h-24" />
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 bg-blue-500/20 text-blue-400 rounded-xl mt-0.5 shrink-0 border border-blue-500/30">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2.5 flex items-center gap-2">
                      <span>AI Answer</span>
                    </h3>
                    <FormattedAIAnswer text={answer} />
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <p className="text-[#AAAAAA] text-xs sm:text-sm mb-4">
                {results.length} dominant results for <span className="text-white font-semibold">"{submitted}"</span>
              </p>
              {results.length === 0 ? (
                <p className="text-[#AAAAAA] text-xs sm:text-sm">No sermons found for that query.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                  {results.map((sermon, idx) => (
                    <SermonCard key={sermon.id} sermon={sermon} index={idx} layout="grid" />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
