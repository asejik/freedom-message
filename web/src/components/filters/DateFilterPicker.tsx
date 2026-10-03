"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatSermonDate } from "@/lib/dates";

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
  const btnRef = useRef<HTMLDivElement>(null);
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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
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

  const formattedValue = formatSermonDate(value);

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
      {/* The chip holds two real buttons (open, clear) so both work by keyboard and screen reader */}
      <div
        ref={btnRef}
        className={`h-10 rounded-full text-xs font-medium flex items-center transition-all whitespace-nowrap border shrink-0 ${
          value
            ? "bg-white text-black border-white font-semibold shadow-md"
            : "bg-white/10 text-white border-white/5 hover:bg-white/15"
        }`}
      >
        <button
          type="button"
          onClick={handleOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`h-full flex items-center gap-1.5 pl-3.5 rounded-full ${value ? "pr-1" : "pr-3.5"}`}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] opacity-80">calendar_today</span>
          <span>{value ? formattedValue : "Date"}</span>
          {!value && <span aria-hidden="true" className="material-symbols-outlined text-[16px] opacity-70">expand_more</span>}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onClear(); setTempDate(""); setOpen(false); }}
            aria-label="Clear date filter"
            className="h-full flex items-center pl-1 pr-3 rounded-full hover:opacity-75"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, position: "fixed", zIndex: 999999 }}
          className="p-3.5 bg-[#121212] border border-white/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] flex flex-col gap-3"
        >
          <label htmlFor="date-filter-input" className="text-xs font-semibold text-[#AAAAAA]">Select Specific Date</label>
          <input
            id="date-filter-input"
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
