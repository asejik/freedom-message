"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function DateFilterPicker({
  value,
  onSelect,
  onClear,
  menuWidth = 256,
}: {
  value: string;
  onSelect: (val: string) => void;
  onClear: () => void;
  /** Maximum dropdown width in px */
  menuWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
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
    setTempDate(value);
    setOpen(true);
  };

  const formattedValue = value
    ? (() => {
        try {
          return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
        } catch { return value; }
      })()
    : "";

  const handleApply = () => {
    if (tempDate) {
      const yearMatch = tempDate.match(/^(\d{4})-\d{2}-\d{2}$/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        if (year >= 1900 && year <= 2100) { onSelect(tempDate); }
      }
    } else { onClear(); }
    setOpen(false);
  };

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
        <span className="material-symbols-outlined text-[16px] opacity-80">calendar_today</span>
        <span>{value ? formattedValue : "Date"}</span>
        {value ? (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); setTempDate(""); setOpen(false); }}
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
          className="p-3.5 bg-[#121212] border border-white/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] flex flex-col gap-3"
        >
          <label className="text-xs font-semibold text-[#AAAAAA]">Select Specific Date</label>
          <input
            type="date"
            value={tempDate}
            onChange={(e) => {
              const val = e.target.value;
              setTempDate(val);
              if (!val) { onClear(); return; }
              const yearMatch = val.match(/^(\d{4})-\d{2}-\d{2}$/);
              if (yearMatch) {
                const year = parseInt(yearMatch[1], 10);
                if (year >= 1900 && year <= 2100) { onSelect(val); }
              }
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
            className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            {value ? (
              <button
                type="button"
                onClick={() => { onClear(); setTempDate(""); setOpen(false); }}
                className="text-xs text-red-400 hover:underline font-medium"
              >
                Clear Filter
              </button>
            ) : <div />}
            <button
              type="button"
              onClick={handleApply}
              className="bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
