'use client';

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Check,
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
      const end = new Date();
      return { startDate: formatDateStr(start), endDate: formatDateStr(end) };
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

  // Calendar month view navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return value.startDate ? new Date(value.startDate) : new Date();
  });

  // Range selection temp state
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Close popup on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === "CUSTOM") {
      onChange({ ...value, preset: "CUSTOM" });
    } else {
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
    if (value.preset !== "CUSTOM" || !value.startDate || (value.startDate && value.endDate && value.startDate !== value.endDate)) {
      // First click: start new range
      onChange({
        preset: "CUSTOM",
        startDate: dayStr,
        endDate: dayStr,
      });
    } else {
      // Second click: finish range
      if (new Date(dayStr) < new Date(value.startDate)) {
        onChange({
          preset: "CUSTOM",
          startDate: dayStr,
          endDate: value.startDate,
        });
      } else {
        onChange({
          preset: "CUSTOM",
          startDate: value.startDate,
          endDate: dayStr,
        });
      }
      setIsOpen(false);
    }
  };

  const isSelected = (dayStr: string) => {
    return dayStr === value.startDate || dayStr === value.endDate;
  };

  const isInRange = (dayStr: string) => {
    if (!value.startDate || !value.endDate) return false;
    const current = new Date(dayStr);
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    return current > start && current < end;
  };

  const isHovered = (dayStr: string) => {
    if (value.preset !== "CUSTOM" || !value.startDate || value.endDate !== value.startDate || !hoverDate) return false;
    const current = new Date(dayStr);
    const start = new Date(value.startDate);
    const hover = new Date(hoverDate);
    if (hover > start) {
      return current > start && current <= hover;
    }
    return current >= hover && current < start;
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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition text-xs font-semibold text-slate-800"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <CalendarIcon className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            {value.preset === "CUSTOM" ? "Date Range" : value.preset.replace("_", " ")}
          </span>
          <span className="text-xs font-bold text-slate-800 font-mono">{getDisplayLabel()}</span>
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 z-50 flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Presets Sidebar */}
          <div className="w-full md:w-44 p-3 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick Ranges</span>
            </div>
            {presetsList.map((p) => {
              const active = value.preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg shrink-0 transition text-left ${
                    active
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/60"
                  }`}
                >
                  <span>{p.label}</span>
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Calendar Picker Panel */}
          <div className="p-4 w-[310px] bg-white">
            {/* Month Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
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
              <span className="font-mono text-[10px]">
                {value.startDate} {value.startDate !== value.endDate && `→ ${value.endDate}`}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
