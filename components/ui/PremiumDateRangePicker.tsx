'use client';

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  CalendarDays,
  CalendarRange,
  X,
} from "lucide-react";

export type DateRangePreset = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "LAST_7_DAYS" | "THIS_MONTH" | "CUSTOM";

export interface DateRangeValue {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface PremiumDateRangePickerProps {
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
  className?: string;
}

function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetRange(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const todayStr = formatDateStr(now);

  switch (preset) {
    case "TODAY":
      return { startDate: todayStr, endDate: todayStr };

    case "YESTERDAY": {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = formatDateStr(y);
      return { startDate: yStr, endDate: yStr };
    }

    case "THIS_WEEK": {
      const current = new Date();
      const first = current.getDate() - current.getDay(); // Sunday
      const start = new Date(current.setDate(first));
      return { startDate: formatDateStr(start), endDate: todayStr };
    }

    case "LAST_7_DAYS": {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { startDate: formatDateStr(start), endDate: todayStr };
    }

    case "THIS_MONTH": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDateStr(start), endDate: todayStr };
    }

    case "CUSTOM":
    default:
      return { startDate: todayStr, endDate: todayStr };
  }
}

export const PremiumDateRangePicker: React.FC<PremiumDateRangePickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection mode: "SINGLE" (one date only) vs "RANGE" (from date to date)
  const isCurrentlyRange = Boolean(
    value.startDate &&
    value.endDate &&
    value.startDate !== value.endDate
  );
  const [selectionMode, setSelectionMode] = useState<"SINGLE" | "RANGE">(
    isCurrentlyRange ? "RANGE" : "SINGLE"
  );

  // In Range mode, tracks first click
  const [rangeStart, setRangeStart] = useState<string | null>(null);

  // Calendar month view navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return value.startDate ? new Date(value.startDate) : new Date();
  });

  // Hover state for range preview
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Sync mode when value changes externally
  useEffect(() => {
    if (value.startDate && value.endDate && value.startDate !== value.endDate) {
      setSelectionMode("RANGE");
    }
  }, [value.startDate, value.endDate]);

  // Close popup on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setRangeStart(null);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    setRangeStart(null);
    if (preset === "TODAY" || preset === "YESTERDAY") {
      setSelectionMode("SINGLE");
      const range = getPresetRange(preset);
      onChange({
        preset,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setIsOpen(false);
    } else if (preset === "CUSTOM") {
      setSelectionMode("RANGE");
      onChange({ ...value, preset: "CUSTOM" });
    } else {
      setSelectionMode("RANGE");
      const range = getPresetRange(preset);
      onChange({
        preset,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setIsOpen(false);
    }
  };

  // Calendar rendering helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handleDayClick = (dayStr: string) => {
    if (selectionMode === "SINGLE") {
      // Single Date mode: clicking any date selects ONLY that date and never creates a range!
      setRangeStart(null);
      onChange({
        preset: "CUSTOM",
        startDate: dayStr,
        endDate: dayStr,
      });
      setIsOpen(false);
      return;
    }

    // Range Mode:
    if (!rangeStart) {
      // Step 1: select start date
      setRangeStart(dayStr);
      onChange({
        preset: "CUSTOM",
        startDate: dayStr,
        endDate: dayStr,
      });
    } else {
      // Step 2: select end date and finish range
      let finalStart = rangeStart;
      let finalEnd = dayStr;
      if (new Date(dayStr) < new Date(rangeStart)) {
        finalStart = dayStr;
        finalEnd = rangeStart;
      }
      setRangeStart(null);
      onChange({
        preset: "CUSTOM",
        startDate: finalStart,
        endDate: finalEnd,
      });
      setIsOpen(false);
    }
  };

  const isSelected = (dayStr: string) => {
    if (selectionMode === "RANGE" && rangeStart) {
      return dayStr === rangeStart;
    }
    return dayStr === value.startDate || dayStr === value.endDate;
  };

  const isInRange = (dayStr: string) => {
    if (selectionMode === "SINGLE") return false;
    const startStr = rangeStart || value.startDate;
    const endStr = rangeStart ? hoverDate : value.endDate;
    if (!startStr || !endStr || startStr === endStr) return false;

    const current = new Date(dayStr);
    const start = new Date(startStr);
    const end = new Date(endStr);
    const min = start < end ? start : end;
    const max = start < end ? end : start;

    return current > min && current < max;
  };

  const isHovered = (dayStr: string) => {
    if (selectionMode !== "RANGE" || !rangeStart || !hoverDate) return false;
    const current = new Date(dayStr);
    const start = new Date(rangeStart);
    const hover = new Date(hoverDate);
    const min = start < hover ? start : hover;
    const max = start < hover ? hover : start;
    return current >= min && current <= max;
  };

  // Human readable label
  const getDisplayLabel = () => {
    if (value.preset === "TODAY") return "Today";
    if (value.preset === "YESTERDAY") return "Yesterday";
    if (value.preset === "THIS_WEEK") return "This Week";
    if (value.preset === "LAST_7_DAYS") return "Last 7 Days";
    if (value.preset === "THIS_MONTH") return "This Month";

    if (value.startDate === value.endDate) {
      return value.startDate;
    }
    return `${value.startDate} - ${value.endDate}`;
  };

  const presetsList: Array<{ id: DateRangePreset; label: string }> = [
    { id: "TODAY", label: "Today" },
    { id: "YESTERDAY", label: "Yesterday" },
    { id: "THIS_WEEK", label: "This Week" },
    { id: "LAST_7_DAYS", label: "Last 7 Days" },
    { id: "THIS_MONTH", label: "This Month" },
    { id: "CUSTOM", label: "Custom Range" },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setRangeStart(null);
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs transition text-xs font-semibold text-slate-800"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <CalendarIcon className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            {value.startDate === value.endDate ? "Date" : "Date Range"}
          </span>
          <span className="text-xs font-bold text-slate-800 font-mono">{getDisplayLabel()}</span>
        </div>
      </button>

      {/* Popover Dropdown (Mobile Centered Modal / Desktop Right-aligned Dropdown) */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-150"
            onClick={() => {
              setIsOpen(false);
              setRangeStart(null);
            }}
          />

          <div className="fixed inset-x-3 top-1/2 -translate-y-1/2 md:translate-y-0 md:static md:absolute md:right-0 md:top-full md:inset-auto mt-0 md:mt-2 z-50 flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] md:max-h-none overflow-y-auto md:overflow-visible max-w-[340px] sm:max-w-[360px] md:max-w-none mx-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Mobile Header Bar */}
            <div className="flex md:hidden items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                Select Date or Range
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setRangeStart(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Sidebar */}
            <div className="w-full md:w-44 p-2.5 md:p-3 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Presets</span>
              </div>
              {presetsList.map((p) => {
                const active = value.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`flex items-center justify-between px-3 py-1.5 md:py-2 text-xs font-semibold rounded-lg shrink-0 transition text-left ${
                      active
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>{p.label}</span>
                    {active && <Check className="w-3.5 h-3.5 hidden md:block" />}
                  </button>
                );
              })}
            </div>

            {/* Calendar Picker Panel */}
            <div className="p-3.5 md:p-4 w-full md:w-[310px] bg-white">
            {/* Mode Switcher: Single Date vs Date Range */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSelectionMode("SINGLE");
                  setRangeStart(null);
                  if (value.startDate) {
                    onChange({
                      preset: "CUSTOM",
                      startDate: value.startDate,
                      endDate: value.startDate,
                    });
                  }
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                  selectionMode === "SINGLE"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Single Date</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectionMode("RANGE");
                  setRangeStart(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                  selectionMode === "RANGE"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Date Range</span>
              </button>
            </div>

            {/* Range hint if in range mode */}
            {selectionMode === "RANGE" && (
              <div className="mb-2 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] text-emerald-800 font-semibold text-center">
                {rangeStart ? "Click second date to complete range" : "Click first date to start range"}
              </div>
            )}

            {/* Month Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty leading offset */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(year, month, dayNum);
                const dayStr = formatDateStr(d);

                const active = isSelected(dayStr);
                const inRange = isInRange(dayStr);
                const hovered = isHovered(dayStr);
                const isToday = dayStr === formatDateStr(new Date());

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => handleDayClick(dayStr)}
                    onMouseEnter={() => setHoverDate(dayStr)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition relative ${
                      active
                        ? "bg-emerald-700 text-white font-bold shadow-xs scale-105 z-10"
                        : inRange || hovered
                        ? "bg-emerald-100/70 text-emerald-900 rounded-none font-bold"
                        : isToday
                        ? "text-emerald-700 font-bold border border-emerald-300"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Range footer summary */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono text-[10px] font-semibold text-slate-700">
                {value.startDate} {value.startDate !== value.endDate && `→ ${value.endDate}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setRangeStart(null);
                }}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </div>
  );
};
