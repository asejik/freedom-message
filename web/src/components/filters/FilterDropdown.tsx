"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function FilterDropdown({
  label,
  value,
  options,
  onSelect,
  onClear,
  menuWidth = 256,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onSelect: (val: string) => void;
  onClear: () => void;
  /** Maximum dropdown width in px */
  menuWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropW = Math.min(menuWidth, window.innerWidth - 24);
      const leftRaw = rect.left;
      const left = Math.min(Math.max(12, leftRaw), window.innerWidth - dropW - 12);
      setDropdownPos({ top: rect.bottom + 6, left, width: dropW });
    }
    setSearch("");
    setOpen(true);
  };

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`h-10 px-3.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap border shrink-0 ${
          value
            ? "bg-white text-black border-white font-semibold shadow-md"
            : "bg-white/10 text-white border-white/5 hover:bg-white/15"
        }`}
      >
        <span>{value ? `${label}: ${value}` : label}</span>
        {value ? (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="material-symbols-outlined text-[14px] hover:opacity-75 ml-0.5"
          >
            close
          </span>
        ) : (
          <span className="material-symbols-outlined text-[16px] opacity-70">expand_more</span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, position: "fixed", zIndex: 999999 }}
          className="max-h-72 bg-[#121212] border border-white/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
        >
          {options.length > 6 && (
            <div className="p-2 border-b border-white/10 shrink-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none placeholder:text-[#AAAAAA]"
              />
            </div>
          )}
          <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1">
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-[#AAAAAA] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              All {label}s (Clear)
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onSelect(opt.label); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-colors flex items-center justify-between ${
                  value === opt.label ? "bg-white text-black font-bold" : "text-white hover:bg-white/10"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.label && <span className="material-symbols-outlined text-[16px]">check</span>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
